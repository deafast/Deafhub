'use client';
import HubPanel from '@/components/hub/HubPanel';
import styles from '@/components/shared/CompetitionSurface.module.css';
export default function TournamentHub(){return <section className={styles.surface}><p className={styles.kicker}>DEAFHUB / COMPETITION</p><div className={styles.catalog}><HubPanel section="tournaments" headingLevel={1}/></div></section>;}
