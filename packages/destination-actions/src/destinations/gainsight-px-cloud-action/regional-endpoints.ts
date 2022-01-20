export const endpoints = {
  track: {
    north_america: 'https://segment-esp.aptrinsic.com/rte/segmentio/v1/push',
    europe: 'https://segment-esp-eu.aptrinsic.com/rte/segmentio/v1/push',
    dev: 'https://esp-dev.aptrinsic.com/rte/segmentio/v1/push',
    // dev: 'http://localhost:8080/rte/segmentio/v1/push',

  },
  batch: {
    north_america: 'https://segment-esp.aptrinsic.com/rte/segmentio/v1/batch',
    europe: 'https://segment-esp-eu.aptrinsic.com/rte/segmentio/v1/batch',
    dev: 'https://esp-dev.aptrinsic.com/rte/segmentio/v1/batch',
    // dev: 'http://localhost:8080/rte/segmentio/v1/batch',
  },
}

type Region = 'north_america' | 'europe' | 'dev'

/**
 * Retrieves Gainsight PX API endpoints for a given region. If the region
 * provided does not exist, the region defaults to 'north_america'.
 *
 * @param endpoint name of the API endpoint
 * @param region data residency region
 * @returns regional API endpoint
 */
export function getEndpointByRegion(endpoint: keyof typeof endpoints, region?: string): string {
  return endpoints[endpoint][region as Region] ?? endpoints[endpoint]['north_america']
}

export default endpoints
