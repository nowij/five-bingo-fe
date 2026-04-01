import api from './axios';
import { AuthUser, LoginRequest, SignupRequest } from '../types';
import { AxiosResponse } from 'axios';

export const signup = (data: SignupRequest): Promise<AxiosResponse<string>> =>
    api.post('/auth/signup', data);

export const login = (data: LoginRequest): Promise<AxiosResponse<AuthUser>> =>
    api.post('/auth/login', data);