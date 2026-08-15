import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accessApi } from './accessApi';
export function LoginPage() {
  const client=useQueryClient(), [userName,setUserName]=useState(''), [password,setPassword]=useState('');
  const login=useMutation({mutationFn:()=>accessApi.login(userName,password),onSuccess:()=>client.invalidateQueries({queryKey:['session']})});
  const submit=(e:FormEvent)=>{e.preventDefault();login.mutate();};
  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <span className="brand-kicker">SMART FACTORY</span><h1>MMS</h1><p>Đăng nhập bằng tài khoản đang sử dụng trên Power Apps.</p>
    <label>Tên đăng nhập<input autoFocus autoComplete="username" value={userName} onChange={e=>setUserName(e.target.value)} required /></label>
    <label>Mật khẩu<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
    {login.isError&&<p className="action-error" role="alert">Tên đăng nhập hoặc mật khẩu không đúng.</p>}
    <button className="button primary" disabled={login.isPending}>{login.isPending?'Đang đăng nhập…':'Đăng nhập'}</button>
  </form></main>;
}
