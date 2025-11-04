const axios = require('axios');

async function testRegister() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/signup', {
      username: 'test_user',
      email: 'test@example.com',
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Registration failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data);
    console.error('Full error:', error.message);
  }
}

testRegister();
