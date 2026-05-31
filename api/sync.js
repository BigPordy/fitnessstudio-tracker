const database = require('../lib/database');
const elementsApi = require('../lib/api-client');

export default async (req, res) => {
  // Nur für Vercel Cron Jobs
  if (req.headers['x-vercel-cron'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Mit Elements API verbinden
    await elementsApi.login(
      process.env.ELEMENTS_USERNAME,
      process.env.ELEMENTS_PASSWORD
    );

    // Studios abrufen
    const studios = await elementsApi.getStudios();

    // Belegungsdaten für jedes Studio abrufen
    for (const studio of studios) {
      const occupancy = await elementsApi.getOccupancy(studio.id);
      
      await database.saveOccupancy({
        studio_id: studio.id,
        current_occupancy: occupancy.current,
        max_capacity: occupancy.capacity
      });

      console.log(`✅ ${studio.name}: ${occupancy.current}/${occupancy.capacity}`);
    }

    res.status(200).json({
      success: true,
      message: `${studios.length} Studios synchronisiert`
    });

  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({
      error: 'Sync fehlgeschlagen',
      message: error.message
    });
  }
};
