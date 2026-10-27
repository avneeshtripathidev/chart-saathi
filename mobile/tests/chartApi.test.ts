import { searchTrains, getChartVacancy, getCoaches, getBerths } from '../src/api/chartApi';

global.fetch = jest.fn();

describe('Mobile chartApi client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searchTrains calls correct URL with query parameter', async () => {
    const mockData = { success: true, data: [{ trainNumber: '12951', trainName: 'Mumbai Rajdhani' }] };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const result = await searchTrains('rajdhani');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(calledUrl).toContain('/api/v1/trains/search');
    expect(calledUrl).toContain('query=rajdhani');
    expect(result).toEqual(mockData);
  });

  it('getChartVacancy sends query params correctly', async () => {
    const mockData = { success: true, data: { chartStatus: 'FINAL_CHART' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const result = await getChartVacancy({
      trainNumber: '12951',
      date: '2026-10-25',
      boardingStation: 'MMCT',
      destinationStation: 'NDLS',
      trainClass: '3A',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(calledUrl).toContain('/api/v1/charts/vacancy');
    expect(calledUrl).toContain('trainNumber=12951');
    expect(calledUrl).toContain('boardingStation=MMCT');
    expect(calledUrl).toContain('trainClass=3A');
    expect(result).toEqual(mockData);
  });

  it('handles network failure gracefully without throwing', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

    const result = await searchTrains('error');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
    expect(result.error?.message).toContain('Connection refused');
  });
});
