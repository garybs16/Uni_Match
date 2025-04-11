const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('🎉 API server is up and running!');
});

// 🎓 University data route
app.get('/api/universities', async (req, res) => {
  try {
    const allResults = [];
    const pagesToFetch = 5; // You can increase this to 10 for ~1000 schools
    const pageSize = 100;

    for (let page = 0; page < pagesToFetch; page++) {
      const response = await axios.get('https://api.data.gov/ed/collegescorecard/v1/schools.json', {
        params: {
          api_key: 'PXQyTlJjewfvUYs51juuopK37choe1xWpidRe3Jl',
          fields: [
            'school.name',
            'school.state',
            'school.city',
            'latest.admissions.admission_rate.overall',
            'latest.admissions.sat_scores.average.overall',
            'latest.student.size',
            'latest.student.demographics.men',
            'latest.student.demographics.women'
          ].join(','),
          per_page: pageSize,
          page: page + 1
        }
      });

      allResults.push(...response.data.results);
    }

    console.log(`✅ Fetched ${allResults.length} raw university records`);

    const formatted = allResults
      .filter(u =>
        u["school.name"] &&
        u["school.state"] &&
        u["school.city"] &&
        u["latest.admissions.admission_rate.overall"] &&
        u["latest.admissions.sat_scores.average.overall"]
      )
      .map(u => ({
        name: u["school.name"],
        state: u["school.state"],
        city: u["school.city"],
        acceptanceRate: u["latest.admissions.admission_rate.overall"] || 0.5,
        sat: u["latest.admissions.sat_scores.average.overall"] || 1100,
        gpa: 3.5, // Placeholder
        ap: 4,
        volunteer: 50,
        extras: 2,
        awards: 2,
        majors: ['Undeclared'], // Placeholder
        info: `${u["school.name"]} located in ${u["school.city"]}, ${u["school.state"]}`
      }));

    console.log(`✅ Returning ${formatted.length} formatted universities`);
    res.json(formatted);

  } catch (error) {
    console.error('❌ Error fetching data from College Scorecard API:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to load university data' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
