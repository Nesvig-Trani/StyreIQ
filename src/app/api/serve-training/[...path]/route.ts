import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '@/features/auth/utils/getAuthUser'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params

  // Verify authentication
  const user = await verifyUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', `/trainings/${pathSegments.join('/')}`)
    return NextResponse.redirect(loginUrl)
  }

  // Serve file from private/trainings
  const filePath = path.join(process.cwd(), 'private', 'trainings', ...pathSegments)

  // Security validation: prevent path traversal attacks
  const allowedDir = path.join(process.cwd(), 'private', 'trainings')
  if (!filePath.startsWith(allowedDir)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const fileBuffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()

    const contentTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.webm': 'video/webm',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving training file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
