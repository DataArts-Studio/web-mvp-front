import { HttpResponse, http } from 'msw';

export const projectHandlers = [
  http.post('/api/projects', async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name');
    const password = formData.get('password');
    const identifierConfirm = formData.get('identifierConfirm');

    if (!name) {
      return HttpResponse.json(
        {
          success: false,
          errors: { name: 'Project name is required' },
        },
        { status: 400 }
      );
    }

    if (password !== identifierConfirm) {
      return HttpResponse.json(
        {
          success: false,
          errors: { password: 'Passwords do not match' },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: 'project-123',
        name,
        url: `https://testea.com/project/${name}`,
      },
    });
  }),
];
