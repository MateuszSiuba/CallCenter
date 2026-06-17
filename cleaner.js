const fs = require('fs');

// Wczytujemy Twojego gigantycznego JSONa
console.log("Wczytuję plik mnt-parsed.json...");
let data = JSON.parse(fs.readFileSync('mnt-parsed.json', 'utf-8'));

// Usuwamy śmieciowe dane (rawSource) z każdego monitora
data.forEach(monitor => {
    if (monitor.specs && monitor.specs.rawSource) {
        delete monitor.specs.rawSource; // To usuwa te 150 niepotrzebnych kolumn!
    }
});

// Zapisujemy odchudzony plik
fs.writeFileSync('mnt-parsed.json', JSON.stringify(data, null, 2));
console.log(`Gotowe! Zapisano ${data.length} monitorów. Plik jest teraz leciutki.`);