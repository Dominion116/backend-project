import { supabase, supabaseAdmin } from '../../config/supabase';
import {
  RegisterDtoType,
  LoginDtoType,
  ForgotPasswordDtoType,
  ResetPasswordDtoType,
  VerifyOtpDtoType,
  ResendOtpDtoType,
} from './auth.dto';

export async function register(dto: RegisterDtoType) {
  const { data, error } = await supabase.auth.signUp({
    email: dto.email,
    password: dto.password,
    options: {
      data: {
        full_name: dto.full_name ?? null,
        role: dto.role,
        phone_number: dto.phone_number ?? null,
      },
    },
  });

  if (error) throw new Error(error.message);

  console.log('[register] data.user:', data.user?.id ?? null, '| phone_number received:', dto.phone_number ?? null);

  // When "Confirm email" is ON, Supabase returns { user: null, session: null }
  // until the user verifies. Profile is created in verifyOtp once we have the user ID.
  // When "Confirm email" is OFF, user is returned immediately and we create the profile now.
  if (data.user) {
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      user_id: data.user.id,
      full_name: dto.full_name ?? null,
      role: dto.role,
      phone_number: dto.phone_number ?? null,
    });
    if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);
  }

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
  const { error } = await supabase.auth.resetPasswordForEmail(dto.email);

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

export async function verifyOtp(dto: VerifyOtpDtoType) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: dto.email,
    token: dto.token,
    type: dto.type,
  });

  if (error) throw new Error(error.message);
  if (!data.session || !data.user) throw new Error('Verification failed — no session returned');

  // Create profile if it doesn't exist yet (signup flow with confirm email ON)
  if (dto.type === 'signup') {
    const meta = data.user.user_metadata as {
      full_name?: string;
      role?: string;
      phone_number?: string;
    };
    console.log('[verifyOtp] user_metadata:', JSON.stringify(meta));
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          user_id: data.user.id,
          full_name: meta.full_name ?? null,
          role: meta.role ?? 'pregnant_woman',
          phone_number: meta.phone_number ?? null,
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );
    if (profileError) console.error('[verifyOtp] profile upsert failed:', profileError.message);
  }

  return data;
}

export async function resendOtp(dto: ResendOtpDtoType) {
  const { error } = await supabase.auth.resend({
    type: dto.type,
    email: dto.email,
  });

  // Don't reveal whether the email exists
  if (error) console.error('[resendOtp]', error.message);
}

export async function logout(accessToken: string) {
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);
  if (error) throw new Error(error.message);
}
