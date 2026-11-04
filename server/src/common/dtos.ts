import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Username: минимум 3 символа' })
  @MaxLength(20, { message: 'Username: максимум 20 символов' })
  @Matches(/^[a-z0-9_]+$/, { message: 'Username: только строчные латинские буквы, цифры и _' })
  username: string;

  @IsString()
  @MinLength(8, { message: 'Пароль: минимум 8 символов' })
  @MaxLength(72)
  password: string;

  @IsString() @IsOptional() @MaxLength(50)
  displayName?: string;
}

export class LoginDto {
  @IsString() @MinLength(1) login: string; // email or username
  @IsString() @MinLength(1) password: string;
}

export class UpdateProfileDto {
  @IsString() @IsOptional() @MaxLength(50) displayName?: string;
  @IsString() @IsOptional() @MaxLength(300) bio?: string;
  @IsString() @IsOptional() @MaxLength(40) visibility?: string; // PUBLIC | PRIVATE
}

export class UpdateSettingsDto {
  @IsBoolean() @IsOptional() privateProfile?: boolean;
  @IsBoolean() @IsOptional() allowComments?: boolean;
  @IsBoolean() @IsOptional() notifyOnFollow?: boolean;
  @IsBoolean() @IsOptional() notifyOnLike?: boolean;
  @IsBoolean() @IsOptional() notifyOnComment?: boolean;
}

export class ForgotPasswordDto { @IsEmail() email: string; }
export class ResetPasswordDto {
  @IsString() @MinLength(16) token: string;
  @IsString() @MinLength(8) @MaxLength(72) newPassword: string;
}

export class CreatePlaylistDto {
  @IsString() @MinLength(1) @MaxLength(80) title: string;
  @IsString() @IsOptional() visibility?: string;
}

export class AddTrackDto { @IsString() trackId: string; }

export class CreatePostDto {
  @IsString() @MaxLength(1000, { message: 'Пост: максимум 1000 символов' }) text: string;
  @IsString() @IsOptional() trackId?: string;
}

export class CreateCommentDto {
  @IsString() @MinLength(1) @MaxLength(500) text: string;
}

export class CreateReportDto {
  @IsString() targetType: string; // USER | POST
  @IsString() targetId: string;
  @IsString() @MinLength(5) @MaxLength(500) reason: string;
}

export class PaginationDto {
  @IsInt() @IsOptional() limit?: number;
  @IsString() @IsOptional() cursor?: string;
}
