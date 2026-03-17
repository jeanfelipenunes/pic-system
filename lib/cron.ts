let cronStarted = false;

export async function startCronJobs() {
  if (cronStarted) return;
  cronStarted = true;

  try {
    const cron = await import('node-cron');

    // Reset monthly votes at midnight on the 1st of each month
    cron.schedule('0 0 1 * *', async () => {
      console.log('🔄 Resetting monthly votes...');
      const { resetMonthlyVotes } = await import('./points');
      await resetMonthlyVotes();
    });

    // Sync LDAP every day at 2am
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running daily LDAP sync...');
      const { syncLDAP } = await import('./ldap');
      const result = await syncLDAP();
      console.log(`✅ LDAP sync: ${result.synced} users synced`);
    });

    console.log('✅ Cron jobs initialized');
  } catch (e) {
    console.error('Failed to start cron jobs:', e);
  }
}
