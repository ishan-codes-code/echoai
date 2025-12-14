"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { authClient } from "@/lib/auth-client";

import { set, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { OctagonAlertIcon } from 'lucide-react';

const formSchema = z
    .object({
        name: z.string().min(1, { message: "Name is required" }),
        email: z.email(),
        password: z.string().min(1, { message: "Password is required" }),
        confirmPassword: z.string().min(1, { message: "Password is required" }),
    })
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        }
    )


const SignUpView = () => {

    const router = useRouter();
    const [error, setError] = useState<string | null>(null);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        }
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {

        setError(null)

        await authClient.signUp.email({
            name: data.name,
            email: data.email,
            password: data.password
        }, {
            onSuccess: () => {
                router.push("/");

            },
            onError: ({ error }) => {
                setError(error.message);
            },
        })
    }


    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">


                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='p-6 md:p-8'>
                            <div className='flex flex-col gap-6'>
                                <div className='flex flex-col items-center justify-center'>
                                    <h1 className='text-2xl font-bold'>Let&apos;s get started</h1>
                                    <p className='text-muted-foreground text-balance'>Create your account</p>
                                </div>
                                <div className='grid gap-3'>
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel> Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder='x@emaple.com' type='text' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}></FormField>

                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel> Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder='x@emaple.com' type='email' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}>

                                    </FormField>
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel> Password</FormLabel>
                                            <FormControl>
                                                <Input placeholder='********' type='password' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}>

                                    </FormField>
                                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input placeholder='********' type='password' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}>

                                    </FormField>
                                </div>
                                {!!error && (
                                    <Alert className='bg-destructive/10 border-none'>
                                        <OctagonAlertIcon className='h-4 w-4 text-destructive!' />
                                        <AlertTitle>{error}</AlertTitle>
                                    </Alert>
                                )}
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                    className="w-full"
                                >
                                    Sign Up
                                </Button>

                                <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
                                    <span className='bg-card text-muted-foreground relative z-10 px-2'>Or continue with</span>
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <Button variant="outline" type='button' className='w-full'>Google</Button>
                                    <Button variant="outline" type='button' className='w-full'>Github</Button>

                                </div>
                                <div className='text-center text-sm'>Already have an account <Link href="/sign-in" className='underline underline-offset-4'>Sign in</Link></div>
                            </div>
                        </form>
                    </Form>


                    <div className='bg bg-radial from-violet-700 to-violet-900 relative hidden md:flex flex-col gap-y-4 items-center justify-center'>
                        <span className='p-2 h-24 w-24 flex items-center justify-center rounded-full bg-black'>
                            <img className='h-20' src="./logo.svg" alt="logo" />
                        </span>
                        <p className='text-2xl font-semibold text-white'>Meet Ai</p>
                    </div>
                </CardContent>
            </Card>
            <div className='text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 '>
                By clicking "Sign Up", you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </div>

        </div>
    )
}

export default SignUpView
