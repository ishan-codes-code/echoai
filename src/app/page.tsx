"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function Home() {

  const { data: session, } = authClient.useSession()


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = () => {
    authClient.signUp.email({
      email,
      name,
      password
    }, {
      onSuccess: () => {
        window.alert("User registered successfully!");
      },
      onError: () => {
        window.alert("Error registering user");
      },
    })
  }

  const onLogin = () => {
    authClient.signIn.email({
      email,
      password
    }, {
      onSuccess: () => {
        window.alert("User registered successfully!");
      },
      onError: () => {
        window.alert("Error registering user");
      },
    })
  }

  if (session) {
    return <div className="p-4 m-auto mt-22 max-w-xl">
      <p>Welcome, {session.user?.name || session.user?.email}!</p>
      <Button onClick={() => authClient.signOut()}>Sign out</Button>
    </div>
  }
  return (
    <div>
      <div className="flex flex-col gap-4 p-4 max-w-xl mt-22 m-auto">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={onSubmit}>Log in</Button>
      </div>

      <div className="flex flex-col gap-4 p-4 max-w-xl mt-22 m-auto">

        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={onLogin}>Submit</Button>
      </div>
    </div>
  );
}
