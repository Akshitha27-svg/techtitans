const fs = require('fs');
const path = require('path');
const { randomBytes, randomInt } = require('crypto');

// Setup logging
const logFile = 'fuzzing_log.txt';
const crashDir = 'crashes';

if (!fs.existsSync(crashDir)) {
    fs.mkdirSync(crashDir);
}

// -------------------------------
// Simulated Target Function
// -------------------------------
function mockSumatraPdfParser(inputData) {
    // Simulated crash conditions
    const crashKeywords = ['%PDF-1337', 'MALFORMED-XREF', 'OVERFLOW'];

    for (const keyword of crashKeywords) {
        if (inputData.includes(keyword)) {
            throw new Error(`Crash Triggered by Input: ${keyword}`);
        }
    }

    // Simulate successful parsing
    return "Parsed successfully";
}

// -------------------------------
// Input Mutation Engine
// -------------------------------
function mutateInput(seedInput) {
    const mutations = [];

    // Add random bytes
    for (let i = 0; i < 5; i++) {
        const randomString = Array.from({ length: 10 }, () => String.fromCharCode(randomInt(32, 126))).join('');
        mutations.push(seedInput + randomString);
    }

    // Inject special crash triggers
    mutations.push(seedInput + '%PDF-1337');       // Simulated crash
    mutations.push(seedInput + 'MALFORMED-XREF');  // Simulated crash
    mutations.push(seedInput + 'OVERFLOW');        // Simulated crash

    return mutations;
}

// -------------------------------
// Fuzzing Harness Simulator
// -------------------------------
function fuzzTarget(seedInput, iterations = 10) {
    const logMessage = `=== Fuzzing started at ${new Date().toISOString()} ===\n`;
    fs.appendFileSync(logFile, logMessage);

    for (let i = 0; i < iterations; i++) {
        const mutatedInputs = mutateInput(seedInput);

        for (let j = 0; j < mutatedInputs.length; j++) {
            const mutatedInput = mutatedInputs[j];
            try {
                const result = mockSumatraPdfParser(mutatedInput);
                const logMessage = `[OK] Iteration ${i}-${j} | Result: ${result}\n`;
                fs.appendFileSync(logFile, logMessage);
            } catch (e) {
                const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
                const crashFile = path.join(crashDir, `crash_${timestamp}_${i}_${j}.txt`);
                fs.writeFileSync(crashFile, mutatedInput);
                const logMessage = `[CRASH] Iteration ${i}-${j} | ${e.message} | Input saved to ${crashFile}\n`;
                fs.appendFileSync(logFile, logMessage);
            }
        }
    }
}

// -------------------------------
// Run Fuzzing Session
// -------------------------------
if (require.main === module) {
    const seed = "%PDF-1.7 Sample Document";
    fuzzTarget(seed, 20);
    console.log("Fuzzing session complete. Check fuzzing_log.txt and crashes/ folder.");
}