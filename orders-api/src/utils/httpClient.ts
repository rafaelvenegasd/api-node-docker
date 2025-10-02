import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CustomersApiConfig } from '../types';

export class HttpClient {
  private client: AxiosInstance;
  private config: CustomersApiConfig;

  constructor(config: CustomersApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.serviceToken}`
      }
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new Error(`Customers API error: ${error.response.data?.error || error.message}`);
        } else if (error.request) {
          throw new Error('Unable to reach Customers API');
        } else {
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  async getCustomerById(id: number): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/internal/customers/${id}`);
    return response.data;
  }

  async validateCustomer(customerId: number): Promise<boolean> {
    try {
      await this.getCustomerById(customerId);
      return true;
    } catch (error) {
      return false;
    }
  }
}

let httpClient: HttpClient | null = null;

export function getHttpClient(): HttpClient {
  if (!httpClient) {
    const config: CustomersApiConfig = {
      baseUrl: process.env.CUSTOMERS_API_BASE || 'http://localhost:3001/api/v1',
      serviceToken: process.env.CUSTOMERS_API_TOKEN || 'your-service-token-change-in-production'
    };
    httpClient = new HttpClient(config);
  }
  return httpClient;
}