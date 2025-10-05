import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/utils/api";

const ssoConfigSchema = z.object({
	issuerUrl: z.string().url("Must be a valid URL"),
	clientId: z.string().min(1, "Client ID is required"),
	clientSecret: z.string().min(1, "Client Secret is required"),
	redirectUri: z.string().url("Must be a valid URL"),
	enabled: z.boolean(),
});

type SsoConfigForm = z.infer<typeof ssoConfigSchema>;

export const SsoSettings = () => {
	const { data, isLoading, refetch } = api.sso.getByOrganization.useQuery();
	const [isEditing, setIsEditing] = useState(false);

	const createMutation = api.sso.create.useMutation({
		onSuccess: () => {
			toast.success("SSO configuration created successfully");
			void refetch();
			setIsEditing(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create SSO configuration");
		},
	});

	const updateMutation = api.sso.update.useMutation({
		onSuccess: () => {
			toast.success("SSO configuration updated successfully");
			void refetch();
			setIsEditing(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update SSO configuration");
		},
	});

	const form = useForm<SsoConfigForm>({
		resolver: zodResolver(ssoConfigSchema),
		defaultValues: {
			issuerUrl: "",
			clientId: "",
			clientSecret: "",
			redirectUri: "",
			enabled: false,
		},
	});

	useEffect(() => {
		if (data) {
			form.reset({
				issuerUrl: data.issuerUrl,
				clientId: data.clientId,
				clientSecret: data.clientSecret,
				redirectUri: data.redirectUri,
				enabled: data.enabled,
			});
		}
	}, [data]);

	const onSubmit = async (values: SsoConfigForm) => {
		if (data) {
			updateMutation.mutate({
				ssoConfigId: data.ssoConfigId,
				...values,
			});
		} else {
			createMutation.mutate(values);
		}
	};

	const handleCancel = () => {
		if (data) {
			form.reset({
				issuerUrl: data.issuerUrl,
				clientId: data.clientId,
				clientSecret: data.clientSecret,
				redirectUri: data.redirectUri,
				enabled: data.enabled,
			});
		} else {
			form.reset({
				issuerUrl: "",
				clientId: "",
				clientSecret: "",
				redirectUri: "",
				enabled: false,
			});
		}
		setIsEditing(false);
	};

	return (
		<Card className="h-full bg-sidebar p-2.5 rounded-xl max-w-5xl mx-auto">
			<div className="rounded-xl bg-background shadow-md">
				<CardHeader>
					<CardTitle className="text-xl flex flex-row gap-2">
						<ShieldCheck className="size-6 text-muted-foreground self-center" />
						SSO Configuration
					</CardTitle>
					<CardDescription>
						Configure Single Sign-On (SSO) with your identity provider (e.g.,
						Keycloak). When enabled, users can authenticate using your SSO
						provider.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 py-8 border-t">
					{isLoading ? (
						<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[25vh]">
							<span>Loading...</span>
							<Loader2 className="animate-spin size-4" />
						</div>
					) : (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								<FormField
									control={form.control}
									name="issuerUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Issuer URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://keycloak.example.com/realms/myrealm"
													{...field}
													disabled={!isEditing}
												/>
											</FormControl>
											<FormDescription>
												The OIDC issuer URL from your identity provider (e.g.,
												Keycloak realm URL)
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="clientId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Client ID</FormLabel>
											<FormControl>
												<Input
													placeholder="dokploy-client"
													{...field}
													disabled={!isEditing}
												/>
											</FormControl>
											<FormDescription>
												The client ID configured in your identity provider
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="clientSecret"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Client Secret</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="••••••••••••••••"
													{...field}
													disabled={!isEditing}
												/>
											</FormControl>
											<FormDescription>
												The client secret from your identity provider
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="redirectUri"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Redirect URI</FormLabel>
											<FormControl>
												<Input
													placeholder="https://dokploy.example.com/api/auth/callback/oidc"
													{...field}
													disabled={!isEditing}
												/>
											</FormControl>
											<FormDescription>
												The callback URL that should be configured in your
												identity provider
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="enabled"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base">Enable SSO</FormLabel>
												<FormDescription>
													When enabled, users will see the SSO login option on
													the login page
												</FormDescription>
											</div>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
													disabled={!isEditing}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<div className="flex gap-2">
									{!isEditing ? (
										<Button type="button" onClick={() => setIsEditing(true)}>
											{data ? "Edit Configuration" : "Create Configuration"}
										</Button>
									) : (
										<>
											<Button
												type="submit"
												disabled={
													createMutation.isPending || updateMutation.isPending
												}
											>
												{createMutation.isPending ||
												updateMutation.isPending ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Saving...
													</>
												) : (
													"Save Configuration"
												)}
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={handleCancel}
												disabled={
													createMutation.isPending || updateMutation.isPending
												}
											>
												Cancel
											</Button>
										</>
									)}
								</div>
							</form>
						</Form>
					)}
				</CardContent>
			</div>
		</Card>
	);
};
