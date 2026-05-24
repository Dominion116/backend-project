import { supabase } from '../../config/supabase';
import { supabaseAdmin } from '../../config/supabase';
import { RegisterDtoType, LoginDtoType } from './auth.dto';

export async function register(dto: RegisterDtoType) {
  const { data, error } = await supabase.auth.signUp({
    email: dto.email,
    password: dto.password,
    options: { data: { full_name: dto.full_name } },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registration failed');

  const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
    user_id: data.user.id,
    full_name: dto.full_name ?? null,
    role: dto.role,
    phone_number: dto.phone_number ?? null,
    // language defaults to 'en', pregnancy_stage defaults to null.
    // Both are updated during the onboarding flow via PATCH /api/profile.
  });

  if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

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
