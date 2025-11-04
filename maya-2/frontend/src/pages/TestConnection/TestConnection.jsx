import React, { useState } from 'react';
import { authAPI } from '../../utils/api';
import './TestConnection.css';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        address: '123 Test St'
      });
      setResult('Registration test successful: ' + JSON.stringify(response.data));
    } catch (error) {
      setResult('Registration test error: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: 'test@example.com',
        password: 'password123'
      });
      setResult('Login test successful: ' + JSON.stringify(response.data));
    } catch (error) {
      setResult('Login test error: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="test-container">
      <h2>Backend Connection Test</h2>
      <div className="test-actions">
        <button onClick={testRegistration} disabled={loading} className="btn btn-primary">
          {loading ? 'Testing...' : 'Test Registration'}
        </button>
        <button onClick={testLogin} disabled={loading} className="btn btn-success">
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>
      {result && (
        <div className="result-box">
          <strong>Result:</strong><br />
          {result}
        </div>
      )}
    </div>
  );
};

export default TestConnection;