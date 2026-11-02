const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const test = require('node:test');
const assert = require('node:assert/strict');

function page({ linked = false, failed = false, authenticated = true } = {}) {
    const queries = [];
    const imports = {
        'next/navigation': { redirect: path => { throw new Error('redirect:' + path); } },
        'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
        '@/components/shared/LocalizedText': { default: ({ ru }) => ru },
        '@/components/auth/ProfileForm': { default: () => React.createElement('div', { 'data-form': true }) },
        '@/components/auth/AuthPanel': { default: props => React.createElement('div', { 'data-steam-link': props.steamOnly }) },
        '@/lib/profile': { profileSchema: { safeParse: data => ({ success: true, data }) } },
        '@/lib/supabase/server': { createClient: async () => ({
            auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'owner' } : null }, error: null }) },
            from: table => ({ select: columns => ({ eq: (key, id) => {
                queries.push({ table, columns, key, id });
                return { maybeSingle: async () => table === 'profiles'
                    ? { data: { nickname: 'Nagato', region: 'europe', telegram: '', vk: '' }, error: null }
                    : { data: linked ? { steam_id: '76561198000000001' } : null, error: failed ? { code: 'unavailable' } : null } };
            } }) }),
        }) },
    };
    const scope = { exports: {}, require: name => imports[name] || require(name) };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/profile/settings/page.tsx', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, scope);
    return { render: scope.exports.default, queries };
}

for (const linked of [true, false]) test(`profile settings preserve the Steam entry point and query only the authenticated owner, linked=${linked}`, async () => {
    const subject = page({ linked });
    const html = renderToStaticMarkup(await subject.render());
    assert.match(html, /id="steam-account"/);
    assert.match(html, /data-form/);
    assert.equal(html.includes('data-steam-link'), !linked);
    assert.equal(html.includes('Steam привязан.'), linked);
    assert.deepEqual(subject.queries, [
        { table: 'profiles', columns: 'nickname,region,telegram,vk', key: 'id', id: 'owner' },
        { table: 'steam_accounts', columns: 'steam_id', key: 'user_id', id: 'owner' },
    ]);
    assert.doesNotMatch(html, /76561198000000001/);
});

test('failed Steam lookup does not claim either a connected account or permission to link', async () => {
    const html = renderToStaticMarkup(await page({ failed: true }).render());
    assert.match(html, /role="alert"/);
    assert.doesNotMatch(html, /data-steam-link|Steam привязан/);
});

test('unauthenticated settings redirect before reading any profile or Steam row', async () => {
    const subject = page({ authenticated: false });
    await assert.rejects(subject.render(), /redirect:\/sign-in/);
    assert.equal(subject.queries.length, 0);
});
