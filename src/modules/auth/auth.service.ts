import { supabase } from '../../config/supabase';
import { supabaseAdmin } from '../../config/supabase';
import { env } from '../../config/env';
import { RegisterDtoType, LoginDtoType, ForgotPasswordDtoType, ResetPasswordDtoType } from './auth.dto';

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

export async function forgotPassword(dto: ForgotPasswordDtoType) {
  const { error } = await supabase.auth.resetPasswordForEmail(dto.email, {
    redirectTo: `${env.FRONTEND_URL}/auth/reset-password`,
  });

  // Always return success to avoid leaking whether an email is registered
  if (error) console.error('[forgotPassword]', error.message);
}

export async function resetPassword(dto: ResetPasswordDtoType) {
  // Validate the recovery token and get the user it belongs to
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(dto.access_token);
  if (userError || !userData.user) throw new Error('Invalid or expired reset token');

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    password: dto.new_password,
  });

  if (error) throw new Error(error.message);
}
