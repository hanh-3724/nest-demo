import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, isNumber, IsString, MinLength } from "class-validator";

export class UserProfileResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    @IsEmail()
    avatar: string;

    @ApiProperty()
    email: string;
}

export class UpdateUserProfileResponseDto {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    currentPassword: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    newPassword: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    confirmPassword: string


    @ApiProperty()
    bio: string
}