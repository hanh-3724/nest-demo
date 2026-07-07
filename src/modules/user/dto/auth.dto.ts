import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignUpRequestDto{
    @ApiProperty()
    @IsEmail() 
    email: string;

    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}

export class SignInRequestDto{
    @ApiProperty()
    @IsEmail() 
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password: string;
}


export class LogoutRequestDto{
    
}