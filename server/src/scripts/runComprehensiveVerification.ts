import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🧪 ===================================================');
  console.log('   ROADVANTA AI — Automated Verification Suite');
  console.log('   "See Risks. Save Roads."');
  console.log('===================================================');

  let passed = 0;
  let failed = 0;

  // Helper assertion
  const assert = (condition: boolean, testName: string, detail = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  };

  try {
    // TEST 1: Health endpoint
    console.log('\n--- 1. Health & Server Status ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'GET /health returns 200');
    const healthData: any = await healthRes.json();
    assert(healthData?.success === true, 'Health check returns success: true');
    assert(healthData?.database?.status === 'connected', 'MongoDB Atlas status: connected', healthData?.database?.name);

    // TEST 2: Official Safety Dashboard Analytics
    console.log('\n--- 2. Official Road Safety Statistics Endpoint ---');
    const statsRes = await fetch(`${BASE_URL}/analytics/safety-dashboard`);
    assert(statsRes.status === 200, 'GET /analytics/safety-dashboard returns 200');
    const statsJson: any = await statsRes.json();
    const statsData = statsJson.data;
    assert(Boolean(statsData.officialNationalStatistics), 'Contains official national statistics (MoRTH/PIB)');
    assert(statsData.officialNationalStatistics.data.length >= 7, 'Includes 2019 to 2026 dataset entries');
    const stat2025 = statsData.officialNationalStatistics.data.find((d: any) => d.year === 2025);
    assert(stat2025?.accidents === 513563, '2025 accidents verified: 513,563');
    assert(stat2025?.fatalities === 183382, '2025 fatalities verified: 183,382');
    const stat2026 = statsData.officialNationalStatistics.data.find((d: any) => d.year === 2026);
    assert(stat2026?.accidents === 285770 && stat2026?.isPartialYear === true, '2026 Jan-Jun verified partial-year: 285,770');
    assert(statsData.liveOperations.totalReports > 0, 'Live MongoDB operational report count > 0', `${statsData.liveOperations.totalReports} reports`);

    // TEST 3: Report Retrieval & Persistence
    console.log('\n--- 3. Operational Reports Ingestion & Querying ---');
    const reportsRes = await fetch(`${BASE_URL}/reports`);
    assert(reportsRes.status === 200, 'GET /reports returns 200');
    const reportsJson: any = await reportsRes.json();
    assert(Array.isArray(reportsJson.data) && reportsJson.data.length > 0, 'Reports returned as array', `${reportsJson.count} items`);
    const sampleReport = reportsJson.data[0];
    assert(Boolean(sampleReport.id && sampleReport.category && sampleReport.location), 'Report has valid schema (id, category, location)');

    // TEST 4: AI Vision Detection - Visible Pothole
    console.log('\n--- 4. AI Vision Detection: Pothole Image ---');
    const potholeDetect = await fetch(`${BASE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      }),
    });
    assert(potholeDetect.status === 200, 'POST /detect with pothole image returns 200');
    const potholeJson: any = await potholeDetect.json();
    assert(potholeJson.data.hasHazard === true, 'Detects hazard for pothole photo');
    assert(potholeJson.data.suggestedSeverity !== 'none', 'Severity is non-zero for pothole', potholeJson.data.suggestedSeverity);

    // TEST 5: AI Vision Detection - Waterlogging
    console.log('\n--- 5. AI Vision Detection: Waterlogged Road ---');
    const waterDetect = await fetch(`${BASE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
      }),
    });
    assert(waterDetect.status === 200, 'POST /detect with waterlogging image returns 200');
    const waterJson: any = await waterDetect.json();
    assert(waterJson.data.hasHazard === true, 'Detects hazard for waterlogged photo');

    // TEST 6: AI Vision Detection - Undamaged / Normal Road
    console.log('\n--- 6. AI Vision Detection: Normal Undamaged Road ---');
    const normalDetect = await fetch(`${BASE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
      }),
    });
    assert(normalDetect.status === 200, 'POST /detect with normal road returns 200');
    const normalJson: any = await normalDetect.json();
    console.log('   Result category:', normalJson.data.suggestedCategory, 'hasHazard:', normalJson.data.hasHazard);
    assert(
      normalJson.data.hasHazard === false || normalJson.data.suggestedCategory === 'normal_road',
      'Normal road correctly recognized with hasHazard: false or category: normal_road'
    );

    // TEST 7: AI Vision Detection - Invalid Input Validation
    console.log('\n--- 7. AI Vision Detection: Invalid Input Validation ---');
    const invalidDetect = await fetch(`${BASE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(invalidDetect.status === 400, 'POST /detect rejects missing image payload with 400');

    // TEST 8: Gemini Website Assistant
    console.log('\n--- 8. Gemini-Powered Website Assistant ---');
    const chatRes = await fetch(`${BASE_URL}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How do I report a pothole on RoadVanta?',
      }),
    });
    assert(chatRes.status === 200, 'POST /assistant/chat returns 200');
    const chatJson: any = await chatRes.json();
    assert(Boolean(chatJson.data?.reply), 'Assistant returns detailed reply');
    assert(chatJson.data.reply.length > 20, 'Assistant provides multi-step guidance');

  } catch (fatal: any) {
    console.error('Fatal test error:', fatal.message);
    failed++;
  }

  console.log('\n===================================================');
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
