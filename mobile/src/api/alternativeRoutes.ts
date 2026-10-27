import type { AlternativeRoute, TrainClass } from '../types';

export function getAlternativeRoutes(
  fromCode: string,
  toCode: string,
  journeyDate: string,
  preferredClass?: TrainClass,
): AlternativeRoute[] {
  const origin = fromCode.toUpperCase();
  const dest = toCode.toUpperCase();

  // 1. Mumbai — Delhi Corridor (MMCT/BDTS to NDLS/NZM)
  if ((origin === 'MMCT' || origin === 'BDTS') && (dest === 'NDLS' || dest === 'NZM')) {
    return [
      {
        id: 'alt-mmct-ndls-1',
        title: 'Route 1 · via Vadodara (BRC)',
        viaSummary: 'MMCT → BRC → NDLS',
        totalDuration: '16h 45m',
        durationMinutes: 1005,
        transferCount: 1,
        tags: ['Fastest', 'Confirmed Vacancy'],
        totalVacant: 14,
        fareEstimate: '₹2,680',
        legs: [
          {
            trainNumber: '12953',
            trainName: 'AK TEJAS RAJ',
            trainClass: preferredClass ?? '3A',
            fromStation: { code: origin, name: 'Mumbai Central' },
            toStation: { code: 'BRC', name: 'Vadodara Junction' },
            departureTime: '17:10',
            arrivalTime: '21:55',
            duration: '4h 45m',
            vacantBerths: 8,
            chartStatus: 'FINAL_CHART',
          },
          {
            trainNumber: '12951',
            trainName: 'NDLS TEJAS RAJ',
            trainClass: preferredClass ?? '3A',
            fromStation: { code: 'BRC', name: 'Vadodara Junction' },
            toStation: { code: dest, name: 'New Delhi' },
            departureTime: '23:15',
            arrivalTime: '08:32',
            duration: '9h 17m',
            vacantBerths: 6,
            chartStatus: 'FINAL_CHART',
          },
        ],
        transfers: [
          {
            station: { code: 'BRC', name: 'Vadodara Junction' },
            waitTime: '1h 20m layover',
            waitMinutes: 80,
          },
        ],
      },
      {
        id: 'alt-mmct-ndls-2',
        title: 'Route 2 · via Kota (KOTA)',
        viaSummary: 'MMCT → KOTA → NDLS',
        totalDuration: '17h 15m',
        durationMinutes: 1035,
        transferCount: 1,
        tags: ['High Vacancy', 'Comfortable Layover'],
        totalVacant: 22,
        fareEstimate: '₹2,340',
        legs: [
          {
            trainNumber: '12955',
            trainName: 'MMCT JP SF EXP',
            trainClass: preferredClass ?? '3A',
            fromStation: { code: origin, name: 'Mumbai Central' },
            toStation: { code: 'KOTA', name: 'Kota Junction' },
            departureTime: '19:05',
            arrivalTime: '07:45',
            duration: '12h 40m',
            vacantBerths: 15,
            chartStatus: 'FIRST_CHART',
          },
          {
            trainNumber: '12059',
            trainName: 'KOTA NDLS JAN SHATABDI',
            trainClass: preferredClass ?? 'CC',
            fromStation: { code: 'KOTA', name: 'Kota Junction' },
            toStation: { code: dest, name: 'New Delhi' },
            departureTime: '09:10',
            arrivalTime: '13:20',
            duration: '4h 10m',
            vacantBerths: 7,
            chartStatus: 'FINAL_CHART',
          },
        ],
        transfers: [
          {
            station: { code: 'KOTA', name: 'Kota Junction' },
            waitTime: '1h 25m layover',
            waitMinutes: 85,
          },
        ],
      },
    ];
  }

  // 2. Kolkata — Delhi Corridor (HWH/SDAH to NDLS/DLI)
  if ((origin === 'HWH' || origin === 'SDAH') && (dest === 'NDLS' || dest === 'DLI')) {
    return [
      {
        id: 'alt-hwh-ndls-1',
        title: 'Route 1 · via Pt. Deen Dayal Upadhyaya (DDU)',
        viaSummary: `${origin} → DDU → ${dest}`,
        totalDuration: '18h 10m',
        durationMinutes: 1090,
        transferCount: 1,
        tags: ['Fastest', 'Confirmed Vacancy'],
        totalVacant: 19,
        fareEstimate: '₹2,540',
        legs: [
          {
            trainNumber: '12301',
            trainName: 'RAJDHANI EXPRES',
            trainClass: preferredClass ?? '3A',
            fromStation: { code: origin, name: 'Howrah Junction' },
            toStation: { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya' },
            departureTime: '16:55',
            arrivalTime: '00:50',
            duration: '7h 55m',
            vacantBerths: 11,
            chartStatus: 'FINAL_CHART',
          },
          {
            trainNumber: '12423',
            trainName: 'DBRG RAJDHANI',
            trainClass: preferredClass ?? '3A',
            fromStation: { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya' },
            toStation: { code: dest, name: 'New Delhi' },
            departureTime: '01:55',
            arrivalTime: '10:30',
            duration: '8h 35m',
            vacantBerths: 8,
            chartStatus: 'FINAL_CHART',
          },
        ],
        transfers: [
          {
            station: { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya' },
            waitTime: '1h 05m layover',
            waitMinutes: 65,
          },
        ],
      },
      {
        id: 'alt-hwh-ndls-2',
        title: 'Route 2 · via Kanpur Central (CNB)',
        viaSummary: `${origin} → CNB → ${dest}`,
        totalDuration: '19h 30m',
        durationMinutes: 1170,
        transferCount: 1,
        tags: ['High Vacancy'],
        totalVacant: 16,
        fareEstimate: '₹2,120',
        legs: [
          {
            trainNumber: '12313',
            trainName: 'SEALDAH RAJDHANI',
            trainClass: preferredClass ?? '3A',
            fromStation: { code: origin, name: 'Howrah Junction' },
            toStation: { code: 'CNB', name: 'Kanpur Central' },
            departureTime: '16:50',
            arrivalTime: '05:25',
            duration: '12h 35m',
            vacantBerths: 10,
            chartStatus: 'FINAL_CHART',
          },
          {
            trainNumber: '12003',
            trainName: 'LKO NDLS SHATABDI',
            trainClass: preferredClass ?? 'CC',
            fromStation: { code: 'CNB', name: 'Kanpur Central' },
            toStation: { code: dest, name: 'New Delhi' },
            departureTime: '16:50',
            arrivalTime: '22:20',
            duration: '5h 30m',
            vacantBerths: 6,
            chartStatus: 'FINAL_CHART',
          },
        ],
        transfers: [
          {
            station: { code: 'CNB', name: 'Kanpur Central' },
            waitTime: '1h 25m layover',
            waitMinutes: 85,
          },
        ],
      },
    ];
  }

  // 3. Dynamic route for any other stations
  const hub1 = 'BRC';
  const hub1Name = 'Vadodara Junction';
  const hub2 = 'CNB';
  const hub2Name = 'Kanpur Central';

  return [
    {
      id: `alt-${origin}-${dest}-1`,
      title: `Route 1 · via ${hub1}`,
      viaSummary: `${origin} → ${hub1} → ${dest}`,
      totalDuration: '17h 20m',
      durationMinutes: 1040,
      transferCount: 1,
      tags: ['Fastest', 'Confirmed Vacancy'],
      totalVacant: 11,
      fareEstimate: '₹2,180',
      legs: [
        {
          trainNumber: '12953',
          trainName: 'AK TEJAS RAJ',
          trainClass: preferredClass ?? '3A',
          fromStation: { code: origin, name: `${origin} Station` },
          toStation: { code: hub1, name: hub1Name },
          departureTime: '16:30',
          arrivalTime: '21:15',
          duration: '4h 45m',
          vacantBerths: 6,
          chartStatus: 'FINAL_CHART',
        },
        {
          trainNumber: '12951',
          trainName: 'NDLS TEJAS RAJ',
          trainClass: preferredClass ?? '3A',
          fromStation: { code: hub1, name: hub1Name },
          toStation: { code: dest, name: `${dest} Station` },
          departureTime: '22:45',
          arrivalTime: '08:32',
          duration: '9h 47m',
          vacantBerths: 5,
          chartStatus: 'FINAL_CHART',
        },
      ],
      transfers: [
        {
          station: { code: hub1, name: hub1Name },
          waitTime: '1h 30m layover',
          waitMinutes: 90,
        },
      ],
    },
    {
      id: `alt-${origin}-${dest}-2`,
      title: `Route 2 · via ${hub2}`,
      viaSummary: `${origin} → ${hub2} → ${dest}`,
      totalDuration: '19h 40m',
      durationMinutes: 1180,
      transferCount: 1,
      tags: ['High Vacancy'],
      totalVacant: 17,
      fareEstimate: '₹1,940',
      legs: [
        {
          trainNumber: '12301',
          trainName: 'RAJDHANI EXPRES',
          trainClass: preferredClass ?? '3A',
          fromStation: { code: origin, name: `${origin} Station` },
          toStation: { code: hub2, name: hub2Name },
          departureTime: '18:15',
          arrivalTime: '05:30',
          duration: '11h 15m',
          vacantBerths: 10,
          chartStatus: 'FIRST_CHART',
        },
        {
          trainNumber: '12423',
          trainName: 'DBRG RAJDHANI',
          trainClass: preferredClass ?? '3A',
          fromStation: { code: hub2, name: hub2Name },
          toStation: { code: dest, name: `${dest} Station` },
          departureTime: '06:50',
          arrivalTime: '11:45',
          duration: '4h 55m',
          vacantBerths: 7,
          chartStatus: 'FINAL_CHART',
        },
      ],
      transfers: [
        {
          station: { code: hub2, name: hub2Name },
          waitTime: '1h 20m layover',
          waitMinutes: 80,
        },
      ],
    },
  ];
}
