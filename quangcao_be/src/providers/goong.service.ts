import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoongService {

  private readonly axios: AxiosInstance;
  constructor(private readonly configService: ConfigService) {
    this.axios = axios.create({
      baseURL: 'https://rsapi.goong.io/v2',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.axios.interceptors.request.use(async (config) => {
      config.params['api_key'] = this.configService.get('GOONG_API_KEY');
      return config;
    });
  }

  async toAddress(lat:string,lng:string):Promise<{
    results: Array<{
      address_components: Array<{
        long_name: string;
        short_name: string;
      }>;
      formatted_address: string;
      geometry: {
        location: { lat: number; lng: number };
        /** Thường là polyline đã mã hoá; có thể vắng/null */
        boundary?: string | null;
      };
      place_id: string;
      reference: string;
      /** Có nơi trả null hoặc object theo Open Location Code */
      plus_code: null | {
        global_code: string;
        compound_code?: string;
      };
      /** Địa giới hành chính hiện hành */
      compound: {
        commune: string;
        province: string;
        district?: string;
      };
      types: string[];
      name: string;
      address: string;
  
      /** Trường cũ — để optional cho an toàn */
      deprecated_description?: string;
      deprecated_compound?: {
        district: string;
        commune: string;
        province: string;
      };
    }>[]
  }> {
    const response = await this.axios.get('/geocode/street', {
      params: {
        latlng: `${lat},${lng}`,
        has_deprecated_administrative_unit:false,
      },
    });
    return response.data;
  }
}