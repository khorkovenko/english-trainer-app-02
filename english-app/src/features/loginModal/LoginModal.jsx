import { useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { supabaseClient } from '../../supabaseClient'

export default function LoginModal({ visible, onHide }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
        setLoading(false)
        if (error) alert(error.message)
        else onHide()
    }

    const handleGoogleLogin = async () => {
        await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        })
    }

    const handleSignUp = async () => {
        setLoading(true)
        const { error } = await supabaseClient.auth.signUp({ email, password })
        setLoading(false)
        if (error) alert(error.message)
        else alert('Check your email to confirm signup.')
    }

    return (
        <Dialog header="Login" visible={visible} onHide={onHide} style={{ width: '25rem' }}>
            <div className="p-fluid">
                <label>Email</label>
                <InputText value={email} onChange={e => setEmail(e.target.value)} />

                <label className="mt-3">Password</label>
                <Password value={password} onChange={e => setPassword(e.target.value)} toggleMask feedback={false} />

                <div className="mt-3 flex justify-between">
                    <Button label="Login" icon="pi pi-sign-in" onClick={handleLogin} loading={loading} />
                    <Button label="Sign Up" icon="pi pi-user-plus" onClick={handleSignUp} loading={loading} />
                </div>

                <div className="mt-4">
                    <Button label="Login with Google" icon="pi pi-google" severity="danger" onClick={handleGoogleLogin} className="w-full" />
                </div>
            </div>
        </Dialog>
    )
}
