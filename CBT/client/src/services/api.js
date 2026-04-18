import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 45000,
});

const api = {
  uploadPdf(formData) {
    return client.post('/upload-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getTest(testId) {
    return client.get(`/test/${testId}`);
  },

  updateTestQuestions(testId, payload) {
    return client.put(`/test/${testId}/questions`, payload);
  },

  submitTest(payload) {
    return client.post('/submit-test', payload);
  },
};

export default api;
