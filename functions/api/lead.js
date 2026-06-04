export async function onRequestPost(context) {
  const { CINC_API_TOKEN } = context.env;

  if (!CINC_API_TOKEN) {
    return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try { body = await context.request.json(); }
  catch { return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { name = '', email = '', phone = '', area, group, vibe, budget, duration, connection } = body;

  if (!email) {
    return new Response(JSON.stringify({ success: false, error: 'Email required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const areaLabels = {
    parksville: 'Parksville', qualicum: 'Qualicum Beach',
    nanoose: 'Nanoose Bay', coombs: 'Coombs & Errington', surprise: 'Mixed areas'
  };

  const noteContent = [
    'Source: Parksville-Qualicum Beach Local Guides',
    'Area of interest: ' + (areaLabels[area] || area || 'Not specified'),
    'Group type: ' + (group || 'Not specified'),
    'Vibe: ' + (vibe || 'Not specified'),
    'Budget: ' + (budget || 'Not specified'),
    'Duration: ' + (duration || 'Not specified'),
    'Connection to area: ' + (connection || 'Not specified')
  ].join('\n');

  const cincPayload = {
    username: email,
    info: {
      contact: {
        first_name: firstName,
        last_name: lastName,
        ...(phone ? { phone } : {})
      }
    },
    notes: [{ content: noteContent, category: 'general', is_pinned: true }]
  };

  try {
    const res = await fetch('https://public.cincapi.com/v2/site/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CINC_API_TOKEN
      },
      body: JSON.stringify(cincPayload)
    });

    if (res.ok) {
      const result = await res.json();
      const action = res.status === 201 ? 'created' : 'updated';
      console.log('CINC lead ' + action + ': ' + result.id);
      return new Response(JSON.stringify({ success: true, action }), { headers: { 'Content-Type': 'application/json' } });
    } else {
      const err = await res.text();
      console.error('CINC error ' + res.status + ': ' + err);
      return new Response(JSON.stringify({ success: false, error: 'CINC API error' }), {
        status: 502, headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    console.error('Fetch failed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Network error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
