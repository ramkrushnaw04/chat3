'use client'

import React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/app/firebase/config'
import { useRouter } from 'next/navigation'

const Profile = () => {

    const router = useRouter()
    let [user] = useAuthState(auth)
    const storedUser = localStorage.getItem('chat3UserInfo')


    if(!user && !storedUser)
        router.push('/log-in')
    else
        user = storedUser
    

  return (
    <div>
      this is profile page
    </div>
  )
}

export default Profile
