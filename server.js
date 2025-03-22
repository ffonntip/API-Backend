import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// กำหนดค่าตัวแปรโดยตรง
const PORT = 5000;
const DRONE_CONFIG_URL = 'https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec';
const DRONE_LOG_URL = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records';

app.use(cors());
app.use(express.json());

const getDroneData = async (drone_id) => {
  try {
    const response = await axios.get(DRONE_CONFIG_URL, { params: { drone_id } });


    if (response.data.status === 'ok') {
      const drone = response.data.data.find(d => d.drone_id.toString() === drone_id.toString());

      if (drone) return drone;
      throw new Error('Drone not found');
    } else {
      throw new Error('Failed to fetch valid data');
    }
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    throw new Error('Failed to fetch drone data');
  }
};




const getDroneLogs = async (drone_id) => {
  try {
    const response = await axios.get(DRONE_LOG_URL, {
      params: {
        filter: `drone_id=${drone_id}`,
        sort: '-created',
        limit: '25',
      },
    });

    if (response.data && response.data.items) {
      return response.data.items.map(({ drone_id, drone_name, created, country, celsius }) => ({
        drone_id,
        drone_name,
        created,
        country,
        celsius,
      }));
    } else {
      throw new Error('No logs found');
    }
  } catch (error) {
    console.error('❌ Error fetching drone logs:', error.message);
    throw new Error('Failed to fetch drone logs');
  }
};

app.get('/api', (req, res) => {
  res.send('API Server is running 🚀');
});

app.get('/configs/:drone_id', async (req, res) => {
  const { drone_id } = req.params;
  try {
    const droneData = await getDroneData(drone_id);
    const { drone_id: id, drone_name, light, country, weight } = droneData;
    res.json({ drone_id: id, drone_name, light, country, weight });
  } catch (error) {
    console.error('❌ Error fetching drone data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/status/:drone_id', async (req, res) => {
  const { drone_id } = req.params;
  try {
    const droneDatas = await getDroneData(drone_id);
    res.json({ condition: droneDatas.condition });
  } catch (error) {
    console.error('❌ Error fetching drone condition:', error.message);
    console.log('✅ API Response Data:', response.data.data);

    res.status(500).json({ error: 'Failed to fetch drone condition' });
  }
});

app.get('/logs/:drone_id', async (req, res) => {
  const { drone_id } = req.params;
  try {
    const logs = await getDroneLogs(drone_id);
    res.json(logs);
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/logs', async (req, res) => {
  const { drone_id, drone_name, country, celsius } = req.body;

  if (!drone_id || !drone_name || !country || celsius === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await axios.post(DRONE_LOG_URL,
      { drone_id, drone_name, country, celsius },
      {
        headers: {
          "Authorization": "Bearer 20250301efx",
          "Content-Type": "application/json",
        },
      }
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.error('❌ Error creating log:', error.message);
    res.status(500).json({ error: "Failed to create log entry" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// หัวใจน้องน้อยคอยนาน

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
