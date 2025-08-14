// features/loginModal/LoginModal.js
import { useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { supabaseClient } from '../../app/supabaseClient'

export default function LoginModal({ visible }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleLogin = async () => {
        setLoading(true)
        setErrorMessage('')
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
        setLoading(false)
        if (error) setErrorMessage(error.message)
    }

    const handleGoogleLogin = async () => {
        console.log('Redirect URL:', process.env.NEXT_PUBLIC_REDIRECT_URL);

        const redirectUrl = typeof window !== 'undefined'
            ? window.location.origin
            : 'https://english-trainer-app-02.vercel.app';

        console.log('Redirect URL:', redirectUrl);

        setErrorMessage('')
        await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl },
        })
    }

    const handleSignUp = async () => {
        setLoading(true)
        setErrorMessage('')
        const { error } = await supabaseClient.auth.signUp({ email, password })
        setLoading(false)
        if (error) setErrorMessage(error.message)
        else setErrorMessage('✅ Check your email to confirm signup.')
    }

    return (
        <Dialog
            header="Login"
            visible={visible}
            modal
            dismissableMask={false}
            closable={false}
            baseZIndex={10000}
            style={{ width: '25rem' }}
            draggable={false}
        >
            <div className="p-fluid">
                <label htmlFor="email">Email</label>
                <InputText
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div style={{ height: '10px' }} />

                <label htmlFor="password" className="mt-3">Password</label>
                <Password
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    toggleMask
                    feedback={false}
                />

                <div style={{ height: '10px' }} />

                {errorMessage && (
                    <div style={{ color: errorMessage.startsWith('✅') ? 'green' : 'red', marginBottom: 10 }}>
                        {errorMessage}
                    </div>
                )}

                <Button
                    label="Login"
                    icon="pi pi-sign-in"
                    onClick={handleLogin}
                    loading={loading}
                    className="w-full"
                />

                <div style={{ height: '10px' }} />

                <Button
                    label="Sign Up"
                    icon="pi pi-user-plus"
                    onClick={handleSignUp}
                    loading={loading}
                    className="w-full"
                />

                <div style={{ height: '10px' }} />

                <Button
                    label="Login with Google"
                    icon="pi pi-google"
                    severity="danger"
                    onClick={handleGoogleLogin}
                    className="w-full"
                />
            </div>
        </Dialog>
    )
}
