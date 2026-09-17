const DEFAULT_API='https://ep-red-lake-ayk3kz85.apirest.c-5.us-east-2.aws.neon.tech/canharitasi/rest/v1';
const API=process.env.DATA_API_URL||DEFAULT_API;
const EXPO='https://exp.host/--/api/v2/push/send';
const DISPATCH_SECRET=process.env.DISPATCH_SECRET||'';

const json=(value,status=200)=>new Response(JSON.stringify(value),{
  status,
  headers:{'content-type':'application/json;charset=utf-8'}
});

export default {
  async fetch(request){
    const url=new URL(request.url);
    if(url.pathname==='/health') return json({ok:true});
    if(url.pathname!=='/dispatch'||request.method!=='POST') return json({error:'not found'},404);

    const authorization=request.headers.get('authorization')||'';
    if(!authorization.startsWith('Bearer ')) return json({error:'authentication required'},401);

    let body={};
    try{ body=await request.json(); }catch{}
    const reportId=String(body?.reportId||'');
    if(!/^[0-9a-f-]{36}$/i.test(reportId)) return json({error:'invalid report id'},400);

    const ownership=await fetch(API+'/rpc/can_dispatch_report_notification',{
      method:'POST',
      headers:{authorization,'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({p_report_id:reportId}),
    });
    if(!ownership.ok) return json({error:'ownership check failed'},ownership.status);
    const allowed=await ownership.json();
    if(allowed!==true) return json({error:'forbidden'},403);
    if(!DISPATCH_SECRET) return json({error:'notification service unavailable'},503);

    const targetResponse=await fetch(API+'/rpc/notification_targets_internal',{
      method:'POST',
      headers:{'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({p_report_id:reportId,p_dispatch_secret:DISPATCH_SECRET}),
    });

    if(!targetResponse.ok){
      const detail=await targetResponse.text();
      return json({error:'target lookup failed',detail:detail.slice(0,300)},502);
    }

    const targets=await targetResponse.json();
    if(!Array.isArray(targets)||targets.length===0) return json({sent:0});

    const seen=new Set();
    const messages=[];
    for(const item of targets){
      const token=String(item.expo_push_token||'');
      if(!token||seen.has(token)) continue;
      seen.add(token);
      messages.push({
        to:token,
        sound:'default',
        channelId:'nearby-help',
        title:'Yakınında bir canın desteğe ihtiyacı var 🐾',
        body:`${item.animal_type||'Bir can'} • ${item.condition||'Yardım çağrısı'}`,
        data:{reportId:item.report_id||reportId,screen:'map'},
        priority:'high',
      });
    }

    let sent=0;
    for(let i=0;i<messages.length;i+=100){
      const batch=messages.slice(i,i+100);
      const push=await fetch(EXPO,{
        method:'POST',
        headers:{
          'content-type':'application/json',
          accept:'application/json',
          'accept-encoding':'gzip, deflate',
        },
        body:JSON.stringify(batch),
      });
      if(push.ok) sent+=batch.length;
    }

    return json({sent});
  }
};
