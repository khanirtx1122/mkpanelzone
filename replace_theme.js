const fs = require('fs');


const files = [
  'src/app/agent/create/CreateCustomerForm.tsx',
  'src/app/agent/create/page.tsx',
  'src/app/agent/layout.tsx',
  'src/app/agent/page.tsx',
  'src/app/checkout/[slug]/CheckoutForm.tsx',
  'src/app/dashboard/DashboardClient.tsx',
  'src/app/mk-agents/page.tsx',
  'src/app/order/success/page.tsx',
  'src/app/order/success/SuccessAutoRedirect.tsx',
  'src/app/privacy/page.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/text-white/g, 'text-foreground')
                     .replace(/text-black/g, 'text-background')
                     .replace(/bg-black(\/[0-9]+)?/g, 'bg-background$1')
                     .replace(/bg-white(\/[0-9]+)?/g, 'bg-foreground$1')
                     .replace(/border-white(\/[0-9]+)?/g, 'border-border-subtle')
                     .replace(/border-black(\/[0-9]+)?/g, 'border-border-subtle');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
