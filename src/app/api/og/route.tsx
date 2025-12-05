import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // ?title=<title>
        const hasTitle = searchParams.has('title');
        const title = hasTitle
            ? searchParams.get('title')?.slice(0, 100)
            : 'Nius - Modern Journalism';

        // ?section=<section>
        const hasSection = searchParams.has('section');
        const section = hasSection
            ? searchParams.get('section')
            : 'News';

        // ?date=<date>
        const hasDate = searchParams.has('date');
        const date = hasDate
            ? new Date(searchParams.get('date')!).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
            : new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundImage: 'linear-gradient(to bottom right, #09090b, #18181b)',
                        padding: '40px 80px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginBottom: '40px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                }}
                            >
                                N
                            </div>
                            <span
                                style={{
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: '#f4f4f5',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Nius
                            </span>
                        </div>
                        <div
                            style={{
                                padding: '8px 24px',
                                borderRadius: '9999px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#e4e4e7',
                                fontSize: 20,
                                fontWeight: 500,
                            }}
                        >
                            {section}
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 64,
                                fontWeight: 800,
                                color: 'white',
                                lineHeight: 1.1,
                                letterSpacing: '-0.02em',
                                maxWidth: '900px',
                                // Text clamp simulation
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {title}
                        </div>
                        <div
                            style={{
                                fontSize: 24,
                                color: '#a1a1aa',
                                marginTop: '20px',
                            }}
                        >
                            {date}
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            bottom: '40px',
                            right: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#71717a',
                            fontSize: 20,
                        }}
                    >
                        <span>Read more at nius.com</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
