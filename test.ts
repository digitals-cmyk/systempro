async function test() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ts1.com', password: 'rju298el' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);

    const token = loginData.token;
    if (!token) {
      console.log('No token');
      return;
    }

    const schoolLearnerRes = await fetch('http://localhost:3000/api/school/learners', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        admissionNumber: 'ADM123',
        fullName: 'Test Learner',
        dob: '2010-01-01',
        dateOfAdmission: '2023-01-01',
        assessmentNumber: 'ASS123',
        grade: '1',
        stream: 'A'
      })
    });
    console.log('School Learner Creation status:', schoolLearnerRes.status);
    try {
      const schoolLearnerData = await schoolLearnerRes.json();
      console.log('School Learner Creation:', schoolLearnerData);
    } catch(e) {
      console.log('Error parsing JSON:', await schoolLearnerRes.text());
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
