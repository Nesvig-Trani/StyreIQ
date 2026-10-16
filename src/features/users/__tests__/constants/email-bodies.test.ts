import { describe, expect, it } from 'vitest'
import { UserRolesEnum } from '@/features/users/schemas'
import { demoConfirmationEmailBody } from '../../constants/demoConfirmationEmailBody'
import { escapeHtml, renderEmailButton, renderEmailLayout } from '../../constants/emailTheme'
import { forgotPasswordEmailBody } from '../../constants/forgotPasswordEmailBody'
import { requestDemoEmailBody } from '../../constants/requestDemoEmailBody'
import { resetPasswordEmailBody } from '../../constants/resetPasswordEmailBody'
import { updatedPermsEmailBody } from '../../constants/updatedPermsEmailBody'
import { welcomeEmailBody } from '../../constants/welcomeEmailBody'

describe('emailTheme', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    )
  })

  it('should render a call to action link with its label', () => {
    const html = renderEmailButton({ href: 'https://app.styreiq.test/login', label: 'Ingresar' })
    expect(html).toContain('href="https://app.styreiq.test/login"')
    expect(html).toContain('>Ingresar</a>')
  })

  it('should wrap content in the branded layout with the logo and title', () => {
    const html = renderEmailLayout({ title: 'Bienvenida', content: '<p>Hola</p>' })
    expect(html).toContain('<title>Bienvenida</title>')
    expect(html).toContain('https://app.styreiq.test/email/styreiq-logo.png')
    expect(html).toContain('<p>Hola</p>')
  })
})

describe('forgotPasswordEmailBody', () => {
  it('should link to the reset page with the url-encoded token', () => {
    const html = forgotPasswordEmailBody({ name: 'Valentina Restrepo', token: 'a+b/c=' })
    expect(html).toContain('Hello Valentina Restrepo,')
    expect(html).toContain('https://app.styreiq.test/reset-password?token=a%2Bb%2Fc%3D')
  })

  it('should greet a generic user when the name is missing', () => {
    expect(forgotPasswordEmailBody({ token: 'abc' })).toContain('Hello User,')
  })
})

describe('resetPasswordEmailBody', () => {
  it('should confirm the password change to the user', () => {
    const html = resetPasswordEmailBody({ name: 'Mateo Giraldo' })
    expect(html).toContain('Mateo Giraldo')
    expect(html.toLowerCase()).toContain('password')
  })
})

describe('demoConfirmationEmailBody', () => {
  it('should include the scheduling link and escape the visitor name', () => {
    const html = demoConfirmationEmailBody({
      name: 'Rodrigo <b>Salazar</b>',
      schedulingUrl: 'https://agenda.styreiq.test/demo',
    })
    expect(html).toContain('href="https://agenda.styreiq.test/demo"')
    expect(html).toContain('Rodrigo &lt;b&gt;Salazar&lt;/b&gt;')
    expect(html).not.toContain('<b>Salazar</b>')
  })
})

describe('requestDemoEmailBody', () => {
  it('should list the visitor details and mark missing optional fields', () => {
    const html = requestDemoEmailBody({
      name: 'Rodrigo Salazar',
      email: 'rodrigo.salazar@colegio-sanpablo.edu',
    })
    expect(html).toContain('Rodrigo Salazar')
    expect(html).toContain('rodrigo.salazar@colegio-sanpablo.edu')
    expect(html).toContain('Not provided')
  })

  it('should include company and role when provided', () => {
    const html = requestDemoEmailBody({
      name: 'Rodrigo Salazar',
      email: 'rodrigo.salazar@colegio-sanpablo.edu',
      company: 'Colegio San Pablo',
      role: 'Director de Comunicaciones',
    })
    expect(html).toContain('Colegio San Pablo')
    expect(html).toContain('Director de Comunicaciones')
    expect(html).not.toContain('Not provided')
  })
})

describe('updatedPermsEmailBody', () => {
  const base = {
    name: 'Mateo Giraldo',
    roleChanged: false,
    statusChanged: false,
    orgsChanged: false,
  }

  it('should only list the sections that changed', () => {
    const html = updatedPermsEmailBody({ ...base, statusChanged: true, status: 'inactive' })
    expect(html).toContain('<strong>Status:</strong> inactive')
    expect(html).not.toContain('<strong>Role')
    expect(html).not.toContain('<strong>Units')
  })

  it('should use the plural label and human readable names for several roles', () => {
    const html = updatedPermsEmailBody({
      ...base,
      roleChanged: true,
      roles: [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager],
    })
    expect(html).toContain('<strong>Roles:</strong> Unit Admin, Social Media Manager')
  })

  it('should fall back to the single legacy role and a generic greeting', () => {
    const html = updatedPermsEmailBody({
      ...base,
      name: '',
      roleChanged: true,
      role: UserRolesEnum.CentralAdmin,
    })
    expect(html).toContain('Hello User,')
    expect(html).toContain('<strong>Role:</strong> Central Admin')
  })

  it('should list the unit names when units changed', () => {
    const html = updatedPermsEmailBody({
      ...base,
      orgsChanged: true,
      organizations: [{ name: 'Dirección de Comunicaciones' }, { name: 'Facultad de Artes' }],
    })
    expect(html).toContain('Dirección de Comunicaciones, Facultad de Artes')
  })
})

describe('welcomeEmailBody', () => {
  const props = { name: 'Laura Pineda', instructions: '', responsibilities: [], policyLinks: [] }

  it('should greet the user and link to the login page', () => {
    const html = welcomeEmailBody(props)
    expect(html).toContain('Welcome to StyreIQ, Laura Pineda')
    expect(html).toContain('href="https://app.styreiq.test/login"')
  })

  it('should fall back to a generic greeting and organization name', () => {
    const html = welcomeEmailBody({ ...props, name: '' })
    expect(html).toContain('Welcome to StyreIQ, there')
    expect(html).toContain('Your organization uses StyreIQ')
  })

  it('should show the default responsibilities when the tenant defines none', () => {
    expect(welcomeEmailBody(props)).toContain('Complete assigned tasks or training')
  })

  it('should show tenant responsibilities, instructions and policy links', () => {
    const html = welcomeEmailBody({
      ...props,
      instructions: 'Revise el manual de marca.\n\nSolicite acceso a Canva.',
      responsibilities: [{ responsibility: 'Publicar solo contenido aprobado' }],
      policyLinks: [
        { title: 'Política de redes', url: 'https://universidad-andina.edu/politicas/redes' },
      ],
    })
    expect(html).toContain('Publicar solo contenido aprobado')
    expect(html).not.toContain('Complete assigned tasks or training')
    expect(html).toContain('Revise el manual de marca.</p>')
    expect(html).toContain('Solicite acceso a Canva.</p>')
    expect(html).toContain('href="https://universidad-andina.edu/politicas/redes"')
  })

  it('should include the tenant admin contact when available', () => {
    const html = welcomeEmailBody({
      ...props,
      tenant: {
        name: 'Universidad Andina',
        adminContactName: 'Andrés Londoño',
        adminContactEmail: 'andres.londono@universidad-andina.edu',
      },
    })
    expect(html).toContain('Universidad Andina uses StyreIQ')
    expect(html).toContain('Andrés Londoño at andres.londono@universidad-andina.edu')
  })
})
