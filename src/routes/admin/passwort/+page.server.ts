import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { passwordSchema } from '#lib/schemas.ts';
import { changePassword } from '#lib/server/users.ts';
import type { Actions } from './$types';

const changePasswordSchema = z
	.object({
		current: z.string().min(1, 'Bitte gib dein aktuelles Passwort ein.'),
		next: passwordSchema,
		confirm: z.string().min(1)
	})
	.refine((data) => data.next === data.confirm, {
		message: 'Die neuen Passwörter stimmen nicht überein.',
		path: ['confirm']
	});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();

		const parsed = changePasswordSchema.safeParse({
			current: formData.get('current'),
			next: formData.get('next'),
			confirm: formData.get('confirm')
		});
		if (!parsed.success) {
			return fail(400, { error: z.prettifyError(parsed.error) });
		}

		const result = await changePassword(locals.user!.id, parsed.data.current, parsed.data.next);
		if (!result.ok) {
			return fail(400, { error: result.error });
		}

		return { success: true as const };
	}
};
