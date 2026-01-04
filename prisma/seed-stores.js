const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const storeData = [
    { code: 'T001', region: 'Ege Akdeniz', city: 'İSTANBUL', name: 'MM ÜMRANİYE MEYDAN' },
    { code: 'T002', region: 'Anadolu', city: 'ESKİŞEHİR', name: 'MM ESKİŞEHİR' },
    { code: 'T003', region: 'Ege Akdeniz', city: 'MERSİN', name: 'MM MERSİN' },
    { code: 'T004', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL BEYLİKDÜZÜ' },
    { code: 'T005', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA OPTIMUM' },
    { code: 'T006', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA FORUM' },
    { code: 'T007', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL KOZYATAĞI' },
    { code: 'T008', region: 'Marmara', city: 'BURSA', name: 'MM BURSA 1 NİLPARK' },
    { code: 'T009', region: 'Anadolu', city: 'ADANA', name: 'MM ADANA 1 M1 AVM' },
    { code: 'T010', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL 212 GÜNEŞLİ' },
    { code: 'T012', region: 'Ege Akdeniz', city: 'İZMİR', name: 'MM İZMİR BALÇOVA' },
    { code: 'T013', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL PENDİK' },
    { code: 'T014', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA KENTPARK' },
    { code: 'T016', region: 'Marmara', city: 'BURSA', name: 'MM BURSA ANATOLIUM' },
    { code: 'T017', region: 'Anadolu', city: 'ADANA', name: 'MM ADANA 2 OPTİMUM' },
    { code: 'T018', region: 'Anadolu', city: 'KAYSERİ', name: 'MM KAYSERİ' },
    { code: 'T020', region: 'Ege Akdeniz', city: 'ANTALYA', name: 'MM ANTALYA 1 KEPEZ' },
    { code: 'T022', region: 'Anadolu', city: 'KONYA', name: 'MM KONYA M1' },
    { code: 'T024', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA ANTARES' },
    { code: 'T025', region: 'Anadolu', city: 'SAMSUN', name: 'MM SAMSUN PİAZZA' },
    { code: 'T026', region: 'Anadolu', city: 'KAHRAMANMARAŞ', name: 'MM KAHRAMANMARAŞ' },
    { code: 'T027', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBULKAĞITHANE' },
    { code: 'T028', region: 'Ege Akdeniz', city: 'AYDIN', name: 'MM AYDIN FORUM' },
    { code: 'T030', region: 'Anadolu', city: 'GAZİANTEP', name: 'MM GAZİANTEP FORUM' },
    { code: 'T031', region: 'Anadolu', city: 'ŞANLIURFA', name: 'MM ŞANLIURFA' },
    { code: 'T032', region: 'Marmara', city: 'İZMİT', name: 'MM İZMİT 1 BAVARİA' },
    { code: 'T033', region: 'Marmara', city: 'İSTANBUL', name: 'MM MALLOF İSTANBUL' },
    { code: 'T034', region: 'Ege Akdeniz', city: 'DENİZLİ', name: 'MM DENİZLİ TERASPARK' },
    { code: 'T035', region: 'Anadolu', city: 'MALATYA', name: 'MM MALATYA' },
    { code: 'T037', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL ÖZDİLEK AVM' },
    { code: 'T039', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA KIZILAY' },
    { code: 'T041', region: 'Ege Akdeniz', city: 'İZMİR', name: 'MM İZMİR POİNT BORNOVA' },
    { code: 'T045', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA NATA VEGA' },
    { code: 'T046', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTABUL LEVENT' },
    { code: 'T047', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL VİAPORT' },
    { code: 'T048', region: 'Anadolu', city: 'KONYA', name: 'MM KONYA KULE SİTE' },
    { code: 'T049', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA ANKAMALL' },
    { code: 'T050', region: 'Ege Akdeniz', city: 'ANTALYA', name: 'MM ANTALYA 2 TERRA CİTY' },
    { code: 'T051', region: 'Anadolu', city: 'GAZİANTEP', name: 'MM GAZİANTEP SANKOPARK' },
    { code: 'T052', region: 'Marmara', city: 'BURSA', name: 'MM BURSA ÖZDİLEK' },
    { code: 'T219', region: 'Anadolu', city: 'ADANA', name: 'MM ADANA ADANORM' },
    { code: 'T055', region: 'Ege Akdeniz', city: 'ANTALYA', name: 'MM ANTALYA 3 MALL OF' },
    { code: 'T056', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL EMAAR AVM' },
    { code: 'T059', region: 'Anadolu', city: 'ERZURUM', name: 'MM ERZURUM MNG AVM' },
    { code: 'T060', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA METROMALL' },
    { code: 'T061', region: 'Anadolu', city: 'ÇORUM', name: 'MM ÇORUM AHL PARK AVM' },
    { code: 'T062', region: 'Anadolu', city: 'ERZURUM', name: 'MM METRO GARDEN' },
    { code: 'T063', region: 'Marmara', city: 'SAKARYA', name: 'MM SAKARYA SERDİVAN AVM' },
    { code: 'T065', region: 'Marmara', city: 'ÇORLU', name: 'MM ÇORLU KİPA AVM' },
    { code: 'T066', region: 'Marmara', city: 'BURSA', name: 'MM BURSA OSMANGAZİ KORUPARK' },
    { code: 'T067', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA GORDİON AVM' },
    { code: 'T072', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL MALTEPE PİAZZA' },
    { code: 'T073', region: 'Marmara', city: 'ÇANAKKALE', name: 'MM ÇANAKKALE KİPA AVM' },
    { code: 'T074', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL CAPACİTY AVM' },
    { code: 'T075', region: 'Ege Akdeniz', city: 'BALIKESİR', name: 'MM BALIKESİR EDREMİT' },
    { code: 'T076', region: 'Ege Akdeniz', city: 'MUĞLA', name: 'MM MUĞLA BODRUM MİDTOWN' },
    { code: 'T078', region: 'Ege Akdeniz', city: 'İZMİR', name: 'MM İZMİR PARK AVM' },
    { code: 'T079', region: 'Marmara', city: 'İSTANBUL', name: 'MM BRANDIUM AVM' },
    { code: 'T080', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA ATLANTİS' },
    { code: 'T081', region: 'Ege Akdeniz', city: 'BALIKESİR', name: 'MM BALIKESİR 10 BURDA' },
    { code: 'T082', region: 'Anadolu', city: 'DİYARBAKIR', name: 'MM DİYARBAKIR KARAVİL' },
    { code: 'T083', region: 'Ege Akdeniz', city: 'İZMİR', name: 'MM İZMİR FORUM BORNOVA AVM' },
    { code: 'T084', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL METROPOL AVM' },
    { code: 'T085', region: 'Anadolu', city: 'ESKİŞEHİR', name: 'MM ESKİŞEHİR VEGA AVM' },
    { code: 'T086', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL HİLLTOWN AVM' },
    { code: 'T087', region: 'Marmara', city: 'KOCAELİ', name: 'MM KOCAELİ GEBZE CENTER' },
    { code: 'T088', region: 'Ege Akdeniz', city: 'İZMİR', name: 'MM İZMİR KARŞIYAKA HİLLTOWN' },
    { code: 'T089', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL VEGA AVM' },
    { code: 'T090', region: 'Marmara', city: 'İSTANBUL', name: 'MM İST. ÜSKÜDAR NEVÇARŞI AVM' },
    { code: 'T091', region: 'Ege Akdeniz', city: 'ANTALYA', name: 'MM ANTALYA MİGROS' },
    { code: 'T092', region: 'Marmara', city: 'İSTANBUL', name: 'MM İSTANBUL TORİUM' },
    { code: 'T093', region: 'Marmara', city: 'TEKİRDAĞ', name: 'MM TEKİRDAĞ TEKİRA' },
    { code: 'T094', region: 'Ege Akdeniz', city: 'MERSİN', name: 'MM MERSİN SAYAPARK' },
    { code: 'T095', region: 'Anadolu', city: 'VAN', name: 'MM VAN' },
    { code: 'T097', region: 'Ege Akdeniz', city: 'İZMİR', name: 'MM İZMİR İSTİNYEPARK' },
    { code: 'T098', region: 'Ege Akdeniz', city: 'BAHÇEŞEHİR', name: 'MM BAHÇEŞEHİR MİGROS' },
    { code: 'T099', region: 'Ege Akdeniz', city: 'BURSA', name: 'MM BURSA KENTMEYDANI' },
    { code: 'T200', region: 'Marmara', city: 'ZORLU', name: 'MM ZORLU CENTER' },
    { code: 'T201', region: 'Marmara', city: 'İZMİT', name: 'MM İZMİT 41 BURDA' },
    { code: 'T202', region: 'Marmara', city: 'İSTMARİNA', name: 'MM İSTMARİNA' },
    { code: 'T203', region: 'Anadolu', city: 'DİYARBAKIR', name: 'MM DİYARBAKIR 3 FORUM' },
    { code: 'T204', region: 'Ege Akdeniz', city: 'BALIKESİR', name: 'MM BALIKESİR BANDIRMA LİMAN' },
    { code: 'T205', region: 'Anadolu', city: 'ANKARA', name: 'MM ANKARA 13 PANORA' },
    { code: 'T206', region: 'Ege Akdeniz', city: 'ANTALYA', name: 'MM ANTALYA ALANYA' },
    { code: 'T207', region: 'Ege Akdeniz', city: 'MARKANTALYA', name: 'MM MARKANTALYA' },
    { code: 'T208', region: 'Ege Akdeniz', city: 'ISPARTA', name: 'MM ISPARTA MEYDAN' },
    { code: 'T209', region: 'Ege Akdeniz', city: 'BURSA', name: 'MM BURSA İNEGÖL' },
    { code: 'T210', region: 'Anadolu', city: 'PARK', name: 'MM PARK AFYON' },
    { code: 'T211', region: 'Marmara', city: 'İSTANBUL', name: 'MM ATLAS PARK İST.' },
    { code: 'T212', region: 'Marmara', city: 'MALTEPE', name: 'MM MALTEPE PARK' },
    { code: 'T213', region: 'Anadolu', city: 'FORUM', name: 'MM FORUM TRABZON' },
    { code: 'T214', region: 'Ege Akdeniz', city: 'KUŞADASI', name: 'MM KUŞADASI' },
    { code: 'T215', region: 'Anadolu', city: 'İSKENDERUN', name: 'MM İSKENDERUN PARK FORBES' },
    { code: 'T216', region: 'Ege Akdeniz', city: 'MANAVGAT', name: 'MM MANAVGAT' },
    { code: 'T217', region: 'Ege Akdeniz', city: 'DENİZLİ', name: 'MM DENİZLİ HORİZON' },
    { code: 'T218', region: 'Anadolu', city: 'ELAZIĞ', name: 'MM ELAZIĞ MERKEZ' },
    { code: 'T501', region: 'Marmara', city: 'BAYRAMPAŞA', name: 'MM BAYRAMPAŞA FORUM' },
    { code: 'T503', region: 'Marmara', city: 'MARMARA', name: 'MM MARMARA FORUM' },
    { code: 'T504', region: 'Ege Akdeniz', city: 'GAZİEMİR', name: 'MM GAZİEMİR OPTİMUM' },
    { code: 'T505', region: 'Marmara', city: 'ŞİŞLİ', name: 'MM ŞİŞLİ TRUMP' },
    { code: 'T506', region: 'Marmara', city: 'MARMARAPARK', name: 'MM MARMARAPARK' }
];

async function main() {
    console.log(`Start seeding ${storeData.length} stores...`);
    for (const store of storeData) {
        await prisma.store.upsert({
            where: { code: store.code },
            update: {
                region: store.region,
                city: store.city,
                name: store.name
            },
            create: {
                code: store.code,
                region: store.region,
                city: store.city,
                name: store.name
            }
        });
    }
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
