// ETS2.SITE PHONE - ETS2 Harita ve Koordinat Veritabanı
// SCS Koordinat Sistemi (X: Doğu-Batı, Z: Kuzey-Güney)

const CITIES = [
  { id: 'istanbul', name: 'İstanbul', country: 'Türkiye', x: 52400, z: 35600, service: true, garage: true },
  { id: 'edirne', name: 'Edirne', country: 'Türkiye', x: 44200, z: 32800, service: true, garage: false },
  { id: 'tekirdag', name: 'Tekirdağ', country: 'Türkiye', x: 48900, z: 36100, service: true, garage: false },
  { id: 'sofia', name: 'Sofya', country: 'Bulgaristan', x: 34500, z: 30100, service: true, garage: true },
  { id: 'berlin', name: 'Berlin', country: 'Almanya', x: 4900, z: -12200, service: true, garage: true },
  { id: 'frankfurt', name: 'Frankfurt am Main', country: 'Almanya', x: -7500, z: -2500, service: true, garage: true },
  { id: 'munich', name: 'Münih', country: 'Almanya', x: 2100, z: 8200, service: true, garage: true },
  { id: 'hamburg', name: 'Hamburg', country: 'Almanya', x: -1200, z: -18500, service: true, garage: true },
  { id: 'paris', name: 'Paris', country: 'Fransa', x: -28500, z: 4500, service: true, garage: true },
  { id: 'lyon', name: 'Lyon', country: 'Fransa', x: -22400, z: 18200, service: true, garage: true },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Hollanda', x: -16800, z: -11500, service: true, garage: true },
  { id: 'vienna', name: 'Viyana', country: 'Avusturya', x: 16800, z: 10400, service: true, garage: true },
  { id: 'prague', name: 'Prag', country: 'Çekya', x: 13200, z: -1400, service: true, garage: true },
  { id: 'warsaw', name: 'Varşova', country: 'Polonya', x: 29200, z: -10200, service: true, garage: true },
  { id: 'milan', name: 'Milano', country: 'İtalya', x: -4200, z: 22800, service: true, garage: true },
  { id: 'rome', name: 'Roma', country: 'İtalya', x: 3800, z: 36400, service: true, garage: true },
  { id: 'budapest', name: 'Budapeşte', country: 'Macaristan', x: 22400, z: 15600, service: true, garage: true },
  { id: 'belgrade', name: 'Belgrad', country: 'Sırbistan', x: 28600, z: 24200, service: true, garage: true }
];

const NODES = {};
CITIES.forEach(c => {
  NODES[c.id] = { id: c.id, name: c.name, x: c.x, z: c.z, type: 'city' };
});

// Important highway junctions
const JUNCTIONS = [
  { id: 'j_berlin_south', name: 'A10 Kavşağı', x: 4200, z: -8500, type: 'junction' },
  { id: 'j_frankfurt_east', name: 'A3 / A5 Ayrımı', x: -4500, z: 1000, type: 'junction' },
  { id: 'j_munich_north', name: 'A9 Otoyol Kavşağı', x: 2000, z: 4500, type: 'junction' },
  { id: 'j_prague_west', name: 'D5 Otoyol Girişi', x: 9200, z: -500, type: 'junction' },
  { id: 'j_vienna_west', name: 'A1 Batı Kavşağı', x: 12500, z: 9800, type: 'junction' },
  { id: 'j_budapest_south', name: 'M5 Otoyol Kavşağı', x: 24500, z: 19500, type: 'junction' },
  { id: 'j_edirne_east', name: 'O-3 / Havsa Kavşağı', x: 47000, z: 34200, type: 'junction' },
  { id: 'j_istanbul_west', name: 'Kınalı / O-3 Gişeleri', x: 50500, z: 35200, type: 'junction' }
];

JUNCTIONS.forEach(j => {
  NODES[j.id] = j;
});

// Services / Repair Shops POIs
const SERVICES = [
  { id: 'srv_istanbul', name: 'İstanbul Scania & Servis', city: 'istanbul', x: 52350, z: 35550 },
  { id: 'srv_edirne', name: 'Edirne DAF Servis', city: 'edirne', x: 44180, z: 32750 },
  { id: 'srv_berlin', name: 'Berlin Mercedes-Benz Servis', city: 'berlin', x: 4850, z: -12150 },
  { id: 'srv_frankfurt', name: 'Frankfurt MAN Servis', city: 'frankfurt', x: -7450, z: -2450 },
  { id: 'srv_paris', name: 'Paris Renault Trucks Servis', city: 'paris', x: -28450, z: 4550 },
  { id: 'srv_vienna', name: 'Viyana Volvo Servis', city: 'vienna', x: 16750, z: 10350 },
  { id: 'srv_prague', name: 'Prag Iveco Servis', city: 'prague', x: 13150, z: -1350 }
];

// Road Network Connections
const ROADS = [
  // Türkiye Otoyol Ağı (O-3 / E80)
  {
    id: 'r_ist_tekirdag',
    name: 'D100 / Sahil Yolu',
    from: 'istanbul',
    to: 'tekirdag',
    speedLimit: 90,
    distanceKm: 135,
    path: [[52400, 35600], [50500, 35200], [48900, 36100]]
  },
  {
    id: 'r_tekirdag_edirne',
    name: 'D555 / Havsa Bağlantısı',
    from: 'tekirdag',
    to: 'edirne',
    speedLimit: 90,
    distanceKm: 120,
    path: [[48900, 36100], [47000, 34200], [44200, 32800]]
  },
  {
    id: 'r_ist_edirne_o3',
    name: 'O-3 / E80 Otoyolu',
    from: 'istanbul',
    to: 'edirne',
    speedLimit: 110,
    distanceKm: 230,
    path: [[52400, 35600], [50500, 35200], [47000, 34200], [44200, 32800]]
  },
  {
    id: 'r_edirne_sofia',
    name: 'A1 / E80 Trakya Otoyolu',
    from: 'edirne',
    to: 'sofia',
    speedLimit: 110,
    distanceKm: 310,
    path: [[44200, 32800], [39000, 31500], [34500, 30100]]
  },
  {
    id: 'r_sofia_belgrade',
    name: 'A4 / E80 Otoyolu',
    from: 'sofia',
    to: 'belgrade',
    speedLimit: 110,
    distanceKm: 390,
    path: [[34500, 30100], [31500, 27200], [28600, 24200]]
  },
  {
    id: 'r_belgrade_budapest',
    name: 'A1 / M5 Otoyolu',
    from: 'belgrade',
    to: 'budapest',
    speedLimit: 110,
    distanceKm: 375,
    path: [[28600, 24200], [24500, 19500], [22400, 15600]]
  },
  {
    id: 'r_budapest_vienna',
    name: 'M1 / A4 Otoyolu',
    from: 'budapest',
    to: 'vienna',
    speedLimit: 110,
    distanceKm: 240,
    path: [[22400, 15600], [19500, 13000], [16800, 10400]]
  },
  {
    id: 'r_vienna_prague',
    name: 'A5 / D1 Otoyolu',
    from: 'vienna',
    to: 'prague',
    speedLimit: 100,
    distanceKm: 295,
    path: [[16800, 10400], [15000, 4500], [13200, -1400]]
  },
  {
    id: 'r_prague_berlin',
    name: 'D8 / A17 / A13 Otoyolu',
    from: 'prague',
    to: 'berlin',
    speedLimit: 110,
    distanceKm: 350,
    path: [[13200, -1400], [9000, -6800], [4200, -8500], [4900, -12200]]
  },
  {
    id: 'r_berlin_hamburg',
    name: 'A24 Otoyolu',
    from: 'berlin',
    to: 'hamburg',
    speedLimit: 120,
    distanceKm: 285,
    path: [[4900, -12200], [1800, -15400], [-1200, -18500]]
  },
  {
    id: 'r_berlin_frankfurt',
    name: 'A9 / A4 / A5 Otoyolu',
    from: 'berlin',
    to: 'frankfurt',
    speedLimit: 110,
    distanceKm: 550,
    path: [[4900, -12200], [4200, -8500], [-1500, -5000], [-7500, -2500]]
  },
  {
    id: 'r_frankfurt_munich',
    name: 'A3 / A9 Otoyolu',
    from: 'frankfurt',
    to: 'munich',
    speedLimit: 110,
    distanceKm: 390,
    path: [[-7500, -2500], [-4500, 1000], [2000, 4500], [2100, 8200]]
  },
  {
    id: 'r_frankfurt_paris',
    name: 'A6 / A4 Otoyolu',
    from: 'frankfurt',
    to: 'paris',
    speedLimit: 110,
    distanceKm: 570,
    path: [[-7500, -2500], [-14500, 500], [-21500, 2500], [-28500, 4500]]
  },
  {
    id: 'r_frankfurt_amsterdam',
    name: 'A3 / A12 Otoyolu',
    from: 'frankfurt',
    to: 'amsterdam',
    speedLimit: 100,
    distanceKm: 440,
    path: [[-7500, -2500], [-12000, -7000], [-16800, -11500]]
  },
  {
    id: 'r_paris_lyon',
    name: 'A6 Otoyolu',
    from: 'paris',
    to: 'lyon',
    speedLimit: 110,
    distanceKm: 460,
    path: [[-28500, 4500], [-25500, 11500], [-22400, 18200]]
  },
  {
    id: 'r_lyon_milan',
    name: 'A43 / Frejus Tüneli / A32',
    from: 'lyon',
    to: 'milan',
    speedLimit: 90,
    distanceKm: 340,
    path: [[-22400, 18200], [-13300, 20500], [-4200, 22800]]
  },
  {
    id: 'r_milan_rome',
    name: 'A1 Güneş Otoyolu (Autostrada del Sole)',
    from: 'milan',
    to: 'rome',
    speedLimit: 110,
    distanceKm: 580,
    path: [[-4200, 22800], [-200, 29600], [3800, 36400]]
  },
  {
    id: 'r_warsaw_berlin',
    name: 'A2 Otoyolu',
    from: 'warsaw',
    to: 'berlin',
    speedLimit: 110,
    distanceKm: 570,
    path: [[29200, -10200], [17000, -11200], [4900, -12200]]
  }
];

// Bidirectional roads
const ALL_ROADS = [];
ROADS.forEach(r => {
  ALL_ROADS.push(r);
  ALL_ROADS.push({
    id: `${r.id}_rev`,
    name: r.name,
    from: r.to,
    to: r.from,
    speedLimit: r.speedLimit,
    distanceKm: r.distanceKm,
    path: [...r.path].reverse()
  });
});

const ETS2_MAP_DATA = {
  CITIES,
  JUNCTIONS,
  NODES,
  SERVICES,
  ROADS: ALL_ROADS
};

if (typeof window !== 'undefined') {
  window.ETS2_MAP_DATA = ETS2_MAP_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ETS2_MAP_DATA;
}
