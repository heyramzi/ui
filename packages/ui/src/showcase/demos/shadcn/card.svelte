<script lang="ts">
	import * as Card from "#src/shadcn/card/index.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { Input } from "#src/shadcn/input/index.js";
	import { Label } from "#src/shadcn/label/index.js";
</script>

<Card.Root class="-my-4 w-full max-w-sm">
	<Card.Header>
		<Card.Title>Login to your account</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
		<Card.Action>
			<Button variant="link">Sign Up</Button>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<form>
			<div class="flex flex-col gap-6">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" required />
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password">Password</Label>
						<a href="##" class="ms-auto inline-block text-sm underline-offset-4 hover:underline">
							Forgot your password?
						</a>
					</div>
					<Input id="password" type="password" required />
				</div>
			</div>
		</form>
	</Card.Content>
	<Card.Footer class="flex-col gap-2">
		<Button type="submit" class="w-full">Login</Button>
		<Button variant="outline" class="w-full">Login with Google</Button>
	</Card.Footer>
</Card.Root>
