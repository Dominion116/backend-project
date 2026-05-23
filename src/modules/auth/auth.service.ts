import { supabase } from '../../config/supabase';
import { RegisterDtoType, LoginDtoType } from './auth.dto';

export async function register(dto: RegisterDtoType) {
  const { data, error } = await supabase.auth.signUp({
    email: dto.email,
    password: dto.password,
    options: { data: { full_name: dto.full_name } },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function login(dto: LoginDtoType) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: dto.email,
    password: dto.password,
  });

  if (error) throw new Error(error.message);
  return data;
}
