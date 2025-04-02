import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const Graph = ({ onBack }) => {
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hiddenLines, setHiddenLines] = useState([]);

  // Fetch historical data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/get-readings?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();

      const formattedData = result.map((item) => ({
        timestamp: new Date(item.timestamp),
        systolic: item.systolic,
        diastolic: item.diastolic,
        heartRate: item.heart_rate,
      }));

      setData(formattedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const toggleLine = (lineKey) => {
    setHiddenLines((prev) =>
      prev.includes(lineKey) ? prev.filter((key) => key !== lineKey) : [...prev, lineKey]
    );
  };

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    if (timeRange === '1day') {
      return format(date, 'HH:mm'); // Show only time
    }
    if (timeRange === '7days') {
      return format(date, 'MM/dd HH:mm'); // Show date + time
    }
    return format(date, 'MM/dd'); // Show only date for long range
  };

  return (
    <motion.div
      className="p-6 bg-gray-900 text-white rounded-lg shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <button
        onClick={onBack}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4 shadow-lg"
      >
        Back
      </button>
      <h1 className="text-3xl font-bold mb-4 text-center">📊 Historical Data</h1>

      {/* Time Range Selector */}
      <div className="flex justify-center items-center mb-6">
        <label htmlFor="timeRange" className="mr-3 font-semibold">Time Range:</label>
        <select
          id="timeRange"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border border-gray-500 rounded bg-gray-800 text-white"
        >
          <option value="1day">Past Day</option>
          <option value="7days">Past 7 Days</option>
          <option value="1month">Past Month</option>
          <option value="3months">Past 3 Months</option>
        </select>
      </div>

      {loading && <p className="text-center text-lg">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12, fill: '#ddd' }}
              angle={-45}
              textAnchor="end"
              interval="preserveStartEnd"
              height={100}
            >
              <Label value="Time Range" offset={-10} position="insideBottom" fill="#ddd" />
            </XAxis>
            <YAxis tick={{ fontSize: 12, fill: '#ddd' }}>
              <Label value="Values" angle={-90} position="insideLeft" fill="#ddd" />
            </YAxis>
            <Tooltip
              contentStyle={{ backgroundColor: '#222', border: '1px solid #666', color: '#fff' }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value, name) => [
                `${value}`,
                name === 'heartRate' ? 'Heart Rate (BPM)' : name,
              ]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              onClick={(e) => toggleLine(e.dataKey)}
              wrapperStyle={{ cursor: 'pointer' }}
            />
            {!hiddenLines.includes('systolic') && (
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#ff4c4c"
                name="Systolic BP"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            )}
            {!hiddenLines.includes('diastolic') && (
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#00d084"
                name="Diastolic BP"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            )}
            {!hiddenLines.includes('heartRate') && (
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#ffcc00"
                name="Heart Rate"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        !loading && <p className="text-center text-lg">No data available for the selected time range.</p>
      )}

      {/* Toggleable Legend */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          className={`px-4 py-2 rounded ${hiddenLines.includes('systolic') ? 'bg-gray-600' : 'bg-red-600'}`}
          onClick={() => toggleLine('systolic')}
        >
          {hiddenLines.includes('systolic') ? 'Show' : 'Hide'} Systolic
        </button>
        <button
          className={`px-4 py-2 rounded ${hiddenLines.includes('diastolic') ? 'bg-gray-600' : 'bg-green-600'}`}
          onClick={() => toggleLine('diastolic')}
        >
          {hiddenLines.includes('diastolic') ? 'Show' : 'Hide'} Diastolic
        </button>
        <button
          className={`px-4 py-2 rounded ${hiddenLines.includes('heartRate') ? 'bg-gray-600' : 'bg-yellow-600'}`}
          onClick={() => toggleLine('heartRate')}
        >
          {hiddenLines.includes('heartRate') ? 'Show' : 'Hide'} Heart Rate
        </button>
      </div>
    </motion.div>
  );
};

export default Graph;
