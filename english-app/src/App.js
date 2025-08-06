import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAuthUser, signOut } from './features/loginModal/authSlice'

import Vocabulary from './features/01vocabulary/Vocabulary'
import Grammar from './features/02grammar/Grammar'
import Reading from './features/03reading/Reading'
import Listening from './features/04listening/Listening'
import Speaking from './features/05speaking/Speaking'
import Writing from './features/06writing/Writing'
import Mistakes from './features/07mistakes/Mistakes'

import { Menubar } from 'primereact/menubar'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { TabPanel, TabView } from 'primereact/tabview'

import LoginModal from './features/loginModal/LoginModal'
import { ProgressSpinner } from 'primereact/progressspinner'
import { supabaseClient } from './app/supabaseClient'

function App() {
    const dispatch = useDispatch()
    const { user, status } = useSelector(state => state.auth)

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [modalVisible, setModalVisible] = useState(false)

    // New: track selected tab index
    const [selectedIndex, setSelectedIndex] = useState(() => {
        const stored = localStorage.getItem('selectedTabIndex')
        return stored !== null ? parseInt(stored, 10) : 0
    })

    useEffect(() => {
        dispatch(fetchAuthUser())

        const authListener = supabaseClient.auth.onAuthStateChange(() => {
            dispatch(fetchAuthUser())
        })

        return () => {
            authListener.data?.subscription?.unsubscribe()
        }
    }, [dispatch])

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (status === 'succeeded' && !user) {
            setModalVisible(true)
        } else if (status === 'succeeded' && user) {
            setModalVisible(false)
        }
    }, [user, status])

    const menuItems = [
        { label: 'English Trainer', icon: 'pi pi-book' },
        {
            label: user ? `Logout (${user.email})` : 'Login',
            icon: user ? 'pi pi-sign-out' : 'pi pi-sign-in',
            command: () => {
                if (user) dispatch(signOut())
            },
        },
    ]

    const tabs = [
        { header: 'Vocabulary', content: <Vocabulary /> },
        { header: 'Grammar', content: <Grammar /> },
        { header: 'Reading', content: <Reading /> },
        { header: 'Listening', content: <Listening /> },
        { header: 'Speaking', content: <Speaking /> },
        { header: 'Writing', content: <Writing /> },
        { header: 'Mistakes', content: <Mistakes /> },
    ]

    // New: handle tab change and store it
    const handleTabChange = (e) => {
        setSelectedIndex(e.index)
        localStorage.setItem('selectedTabIndex', e.index)
    }

    return (
        <div className="h-screen flex flex-col">
            {status === 'loading' && (
                <div className="flex justify-center items-center h-screen w-screen">
                    <ProgressSpinner />
                </div>
            )}

            <LoginModal visible={modalVisible} />

            {status === 'succeeded' && user && (
                <>
                    <Menubar model={menuItems} />
                    <div className="p-4 flex-grow overflow-auto">
                        {isMobile ? (
                            <Accordion multiple activeIndex={[selectedIndex]} onTabChange={(e) => handleTabChange({ index: e.index[0] })}>
                                {tabs.map(({ header, content }, i) => (
                                    <AccordionTab key={header} header={header}>
                                        {content}
                                    </AccordionTab>
                                ))}
                            </Accordion>
                        ) : (
                            <TabView activeIndex={selectedIndex} onTabChange={handleTabChange}>
                                {tabs.map(({ header, content }) => (
                                    <TabPanel key={header} header={header}>
                                        {content}
                                    </TabPanel>
                                ))}
                            </TabView>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default App
