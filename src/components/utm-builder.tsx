'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { QRCode } from '@/components/qr-code';

const formSchema = z.object({
    originalUrl: z.string().url('Please enter a valid URL'),
    alias: z.string().min(3, 'Alias must be at least 3 characters').optional().or(z.literal('')),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    utmTerm: z.string().optional(),
    utmContent: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function UTMBuilder() {
    const [generatedLink, setGeneratedLink] = useState<{ shortUrl: string; originalUrl: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            originalUrl: '',
            alias: '',
            utmSource: '',
            utmMedium: '',
            utmCampaign: '',
            utmTerm: '',
            utmContent: '',
        },
    });

    async function onSubmit(data: FormValues) {
        setError(null);
        setGeneratedLink(null);

        try {
            const response = await fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || 'Failed to create link');
            }

            const result = await response.json();
            // Construct full short URL (assuming window.location.origin for client-side display)
            const shortUrl = `${window.location.origin}/${result.alias}`;
            setGeneratedLink({ shortUrl, originalUrl: result.originalUrl });
            form.reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Link</CardTitle>
                    <CardDescription>Enter destination URL and optional UTM parameters.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="originalUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destination URL *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/promo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="alias"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Custom Alias (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="summer-sale" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="utmSource"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Source (utm_source)</FormLabel>
                                            {/* Suggestion: Could be a Select for common sources */}
                                            <FormControl>
                                                <Input placeholder="facebook, google, newsletter" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="utmMedium"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Medium (utm_medium)</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select medium" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cpc">cpc</SelectItem>
                                                        <SelectItem value="social">social</SelectItem>
                                                        <SelectItem value="email">email</SelectItem>
                                                        <SelectItem value="organic">organic</SelectItem>
                                                        <SelectItem value="referral">referral</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="utmCampaign"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign (utm_campaign)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="spring_sale_2026" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    <>
                                        <LinkIcon className="mr-2 h-4 w-4" /> Shorten URL
                                    </>
                                )}
                            </Button>

                            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {generatedLink && (
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-green-600">Link Created Successfully!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Short URL</label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={generatedLink.shortUrl} className="font-mono bg-white" />
                                <Button
                                    variant="secondary"
                                    onClick={() => navigator.clipboard.writeText(generatedLink.shortUrl)}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <QRCode url={generatedLink.shortUrl} size={200} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
