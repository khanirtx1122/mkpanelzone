<USER_REQUEST>
======================================================================
MK PANEL ZONE
ULTRA-MASTER EXPANSION / INTEGRATION SPECIFICATION
EXISTING WEBSITE â€” DO NOT REBUILD FROM SCRATCH
CUSTOMER PLATFORM SPLIT + OWNER ADMIN PANEL + AGENT PANEL
======================================================================

CRITICAL INSTRUCTION:

THIS IS AN EXISTING WORKING PROJECT.

DO NOT:
- rebuild the website from scratch
- replace the entire design system
- randomly redesign the homepage
- destroy existing product pages
- remove existing animations
- rename existing working routes unnecessarily
- change existing database behavior without migration
- break current products
- remove existing customer records
- remove existing resources
- reset the project
- replace working components just because a different implementation is easier

FIRST inspect the complete existing codebase.

Understand what currently works.

Then EXTEND the existing project carefully.

The goal is to add:

1. PLATFORM-SPECIFIC CUSTOMER ACCESS
2. ANDROID CUSTOMER DASHBOARD
3. IPHONE CUSTOMER DASHBOARD
4. PC CUSTOMER DASHBOARD
5. PLATFORM-LOCKED CUSTOMER CREDENTIALS
6. FULL OWNER ADMIN PANEL
7. LIMITED AGENT PANEL
8. PAYMENT-RECEIPT PROOF FOR AGENT-CREATED ACCOUNTS
9. COMPLETE ROLE SEPARATION
10. STRONG BACKEND AUTHORIZATION

The existing public-facing visual identity must remain recognizable.

Current brand:

MK PANEL ZONE

Theme:

BLACK
DARK NAVY BLUE
DEEP DARK RED / CRIMSON

Public website UI should remain consistent with the existing project.

Do NOT introduce visual inconsistency.

======================================================================
PART 1 â€” FIRST PERFORM A COMPLETE CODE AUDIT
======================================================================

Before implementing anything:

inspect:

- package.json
- framework version
- Next.js routing
- existing components
- existing database
- existing customer access system
- existing customer table
- existing device-binding logic
- existing resource tables
- existing session system
- existing dashboard route
- current Customer Access page
- product pages
- checkout
- site settings
- environment variables
- Supabase implementation
- current storage
- current middleware
- current server actions
- current API routes
- current authentication utilities
- current public UI
- current buttons
- responsive system
- existing CSS/Tailwind configuration

DO NOT duplicate systems that already exist.

If an existing function works correctly:
preserve it.

If an existing function is broken:
repair it.

If database structure needs extending:
create migrations.

Do not delete existing production data.

======================================================================
PART 2 â€” CORE PLATFORM CONCEPT
======================================================================

MK Panel Zone will now have three customer-access categories:

ANDROID

IPHONE / IOS

PC

Each customer credential must belong to EXACTLY ONE platform category.

Examples:

Customer A:
platform_type = ANDROID

Customer B:
platform_type = IOS

Customer C:
platform_type = PC

A customer's credentials must only work inside the matching platform
customer-access section.

Android credentials cannot access iPhone.

Android credentials cannot access PC.

iPhone credentials cannot access Android.

iPhone credentials cannot access PC.

PC credentials cannot access Android.

PC credentials cannot access iPhone.

This platform restriction must be enforced SERVER-SIDE.

Do not rely on hiding buttons in frontend.

======================================================================
PART 3 â€” CUSTOMER ACCESS ENTRY EXPERIENCE
======================================================================

The existing Customer Access CTA remains.

Example existing CTA:

ACCESS MY FILES

or current equivalent.

When customer clicks Customer Access:

do NOT immediately show only username/password.

First open a premium platform selection experience.

Page:

/access

or preserve existing customer-access route.

Display heading:

CUSTOMER ACCESS

Supporting text:

Select your platform to continue.

Then show exactly three platform cards.

ANDROID

IPHONE

PC

The cards must use the existing website's visual style.

Do not redesign entire page into a completely unrelated theme.

======================================================================
PART 4 â€” PLATFORM CARDS
======================================================================

Three premium platform cards.

ANDROID card:

icon:
smartphone / Android-style neutral device icon.

Title:

ANDROID

Description:

Access your Android package resources and setup files.

CTA:

CONTINUE

IPHONE card:

icon:
smartphone device icon.

Title:

IPHONE

Description:

Access your iPhone package file and setup guide.

CTA:

CONTINUE

PC card:

icon:
desktop/computer.

Title:

PC

Description:

Access your PC package resources.

CTA:

CONTINUE

Use official-neutral device icons.

Do not unnecessarily use copyrighted logos if assets are not supplied.

======================================================================
PART 5 â€” PLATFORM SELECTION ANIMATION
======================================================================

Do not over-animate.

Use:

small card elevation
soft border glow
subtle icon movement
fast response

Hover duration:

approximately 180â€“220ms.

Click:

quick press scale.

Then transition to login form.

Do not reload the entire site unnecessarily.

======================================================================
PART 6 â€” CUSTOMER LOGIN AFTER PLATFORM SELECTION
======================================================================

After customer chooses a platform:

show:

DEVICE / CUSTOMER ID

PASSWORD

ACCESS MY FILES

Selected platform should remain clearly visible.

Example:

ANDROID ACCESS

or

IPHONE ACCESS

or

PC ACCESS

Allow:

CHANGE PLATFORM

small secondary control.

======================================================================
PART 7 â€” LOGIN REQUEST MUST INCLUDE PLATFORM
======================================================================

Login request must include:

customer_identifier
password
selected_platform

Example:

identifier:
HUAWEI-Y6-ALI

password:
*******

selected_platform:
ANDROID

Backend then finds customer account.

======================================================================
PART 8 â€” CUSTOMER PLATFORM DATABASE FIELD
======================================================================

Add:

platform_type

to customer authentication records.

Recommended enum:

ANDROID
IOS
PC

Do not use free-form strings if avoidable.

======================================================================
PART 9 â€” PLATFORM VALIDATION ORDER
======================================================================

Login logic:

1. receive identifier
2. receive password
3. receive selected platform
4. rate limit request
5. locate customer
6. securely verify password
7. verify customer active status
8. verify customer's platform
9. perform device binding
10. create customer session
11. redirect correct dashboard

======================================================================
PART 10 â€” WRONG PLATFORM BEHAVIOR
======================================================================

This is VERY IMPORTANT.

If customer credentials are valid but selected platform is wrong:

DO NOT say:

Invalid password.

Instead identify that credentials are valid but belong to another
platform.

Example:

Customer account:

platform = ANDROID

Customer selected:

IPHONE

Display:

WRONG PLATFORM

This customer access belongs to the Android section.

Please select Android Customer Access and try again.

Button:

GO TO ANDROID ACCESS

Secondary:

CHANGE PLATFORM

Similarly:

ANDROID credential entered under PC:

WRONG PLATFORM

This customer access belongs to Android.

iPhone credential entered under Android:

WRONG PLATFORM

This customer access belongs to iPhone.

PC credential entered under iPhone:

WRONG PLATFORM

This customer access belongs to PC.

======================================================================
PART 11 â€” WRONG PLATFORM SECURITY
======================================================================

Do not expose:

customer name
resources
password
device information

Only platform type may be shown because credentials were already
successfully verified.

If credentials themselves are invalid:

use normal generic error:

Invalid customer ID or password.

======================================================================
PART 12 â€” PLATFORM VISUAL INDICATION
======================================================================

Do not completely recolor the site per platform.

Maintain MK Panel Zone theme.

Use very small distinctions:

Android:
subtle blue accent.

iPhone:
cool white / steel-blue accent.

PC:
dark crimson + blue mixture.

But all remain inside:

black
dark navy
dark red

brand identity.

======================================================================
PART 13 â€” DEVICE LOCK
======================================================================

Existing one-device customer-binding behavior must continue.

Customer account can belong to:

one platform
+
one registered supported device/browser environment.

Changing the platform selection does not bypass device lock.

Changing browser/device must not bypass platform lock.

All security checks happen server-side.

======================================================================
PART 14 â€” CUSTOMER SESSION PLATFORM CLAIM
======================================================================

After login, secure session must contain/reference:

customer_id

platform_type

device_record_id

session expiry

Do not trust platform from browser after authentication.

======================================================================
PART 15 â€” CUSTOMER DASHBOARD ROUTING
======================================================================

Preferred clean architecture:

/dashboard/android

/dashboard/ios

/dashboard/pc

OR:

/dashboard

with platform-specific server rendering.

Choose whichever integrates more cleanly with existing project.

But authorization must ensure a customer cannot manually enter another
platform URL.

Example:

Android customer manually opens:

/dashboard/ios

SERVER MUST DENY / REDIRECT.

Do not merely hide iPhone content.

======================================================================
PART 16 â€” ANDROID DASHBOARD
======================================================================

ANDROID currently receives the full resource package.

This is the existing full customer-resource system.

Preserve the current system and organize professionally.

ANDROID RESOURCES:

1. MAIN FILE

2. FILE PASSWORD

3. MAIN SETUP TUTORIAL

4. MT MANAGER

5. MT MANAGER TUTORIAL

6. SHIZUKU

7. SHIZUKU SETUP TUTORIAL

Do not remove any existing correct Android resources.

======================================================================
PART 17 â€” ANDROID MAIN FILE
======================================================================

Display:

MAIN FILE

status:

READY TO DOWNLOAD

button:

DOWNLOAD FILE

If file is private:

verify session
verify Android platform
verify package
verify device binding

before issuing download/signed URL.

======================================================================
PART 18 â€” ANDROID FILE PASSWORD
======================================================================

Card:

FILE PASSWORD

Masked by default.

Example:

â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢

Buttons:

SHOW

COPY

COPY feedback:

COPIED

then return.

======================================================================
PART 19 â€” ANDROID MAIN TUTORIAL
======================================================================

Title:

MAIN SETUP TUTORIAL

CTA:

WATCH TUTORIAL

======================================================================
PART 20 â€” ANDROID MT MANAGER
======================================================================

Title:

MT MANAGER

Actions:

DOWNLOAD APP

WATCH MT MANAGER TUTORIAL

======================================================================
PART 21 â€” ANDROID SHIZUKU
======================================================================

Title:

SHIZUKU

Badge:

ANDROID 11+

Actions:

DOWNLOAD SHIZUKU

WATCH SETUP TUTORIAL

======================================================================
PART 22 â€” ANDROID RESOURCE ORGANIZATION
======================================================================

Do not display seven raw links.

Use groups:

PRIMARY ACCESS

Main File
File Password

TOOLS

MT Manager
Shizuku

GUIDES

Main Tutorial
MT Tutorial
Shizuku Tutorial

======================================================================
PART 23 â€” IOS / IPHONE CUSTOMER DASHBOARD
======================================================================

iPhone customers must receive a much simpler dashboard.

Do NOT show Android-specific resources.

IPHONE DASHBOARD CURRENTLY CONTAINS ONLY:

1. IPHONE FILE

2. IPHONE TUTORIAL

No password section for iPhone at this time.

No MT Manager.

No Shizuku.

No Android tutorial.

No PC password.

======================================================================
PART 24 â€” IPHONE FILE CARD
======================================================================

Title:

IPHONE FILE

small label:

PRIMARY RESOURCE

status:

READY

CTA:

DOWNLOAD FILE

Resource comes from iOS package/database.

======================================================================
PART 25 â€” IPHONE TUTORIAL CARD
======================================================================

Title:

IPHONE SETUP TUTORIAL

CTA:

WATCH TUTORIAL

Short supporting copy.

======================================================================
PART 26 â€” IPHONE DASHBOARD LAYOUT
======================================================================

Because only two resources exist:

do not make page look empty.

Desktop:

two high-quality larger resource cards.

Optional top information panel.

Mobile:

stack.

Use good spacing.

======================================================================
PART 27 â€” PC DASHBOARD
======================================================================

PC currently contains:

1. PC FILE

2. PC FILE / USER PASSWORD

No tutorial required unless added later.

Do not show:

MT Manager
Shizuku
Android resources
iPhone tutorial

======================================================================
PART 28 â€” PC FILE CARD
======================================================================

Title:

PC FILE

status:

READY TO DOWNLOAD

CTA:

DOWNLOAD FILE

======================================================================
PART 29 â€” PC PASSWORD CARD
======================================================================

Title:

FILE PASSWORD

or if existing business naming requires:

USER PASSWORD

The password should be masked initially.

Buttons:

SHOW

COPY

Customer clicks SHOW to reveal.

Customer clicks COPY to copy.

Do not automatically display secret on page load.

======================================================================
PART 30 â€” PC FUTURE RESOURCE SUPPORT
======================================================================

Database architecture should allow future:

tutorial
additional file
setup guide

without rewriting dashboard.

But do not add them to current UI.

======================================================================
PART 31 â€” PLATFORM PACKAGE ARCHITECTURE
======================================================================

Packages/resources should know platform.

Recommended:

packages

id
name
platform_type
description
active
created_at
updated_at

Example:

Android Main Package

platform_type:
ANDROID

iPhone Main Package

platform_type:
IOS

PC Main Package

platform_type:
PC

======================================================================
PART 32 â€” PACKAGE RESOURCES
======================================================================

package_resources:

id
package_id
resource_type
title
description
resource_url
secret_value
version
status
sort_order
created_at
updated_at

======================================================================
PART 33 â€” PLATFORM RESOURCE TYPES
======================================================================

Allow resource types:

MAIN_FILE
FILE_PASSWORD
MAIN_TUTORIAL
MT_MANAGER
MT_TUTORIAL
SHIZUKU
SHIZUKU_TUTORIAL
CUSTOM_FILE
CUSTOM_TUTORIAL

Platform determines what is rendered.

======================================================================
PART 34 â€” CUSTOMER PACKAGE VALIDATION
======================================================================

When assigning package:

customer.platform_type

must match:

package.platform_type.

Prevent accidentally assigning Android customer to iPhone package.

Enforce server-side.

======================================================================
PART 35 â€” EXISTING CUSTOMER MIGRATION
======================================================================

Existing customers from current project should be migrated safely.

If all current customer access belongs to Android:

migration can assign:

platform_type = ANDROID

to existing customers.

DO NOT:
delete customers
reset passwords
delete device bindings

Preserve existing customer records.

======================================================================
PART 36 â€” EXISTING RESOURCE MIGRATION
======================================================================

Existing current resource bundle should become:

ANDROID package/resources.

Do not lose existing URLs or passwords.

======================================================================
PART 37 â€” PLATFORM SELECTION PAGE UI
======================================================================

IMPORTANT:

PUBLIC WEBSITE UI SHOULD REMAIN CONSISTENT.

Do not completely redesign current website.

Use existing:

fonts
colors
navigation
spacing
animation language
glass cards

Improve only where necessary.

======================================================================
PART 38 â€” CUSTOMER ACCESS MOBILE
======================================================================

Platform cards:

mobile can stack vertically.

Android

iPhone

PC

Tap targets:

minimum ~48px.

Fast response.

======================================================================
PART 39 â€” BACK NAVIGATION
======================================================================

If user chooses wrong card accidentally:

CHANGE PLATFORM

returns selection without replaying website intro.

======================================================================
PART 40 â€” LOGOUT
======================================================================

Each dashboard has:

LOG OUT

Logout:

destroys customer session.

Does NOT delete device binding.

Returns to:

/access

======================================================================
PART 41 â€” CUSTOMER PLATFORM LABEL
======================================================================

Dashboard may show:

ANDROID ACCESS

IPHONE ACCESS

PC ACCESS

small badge near top.

======================================================================
PART 42 â€” PUBLIC NAVBAR
======================================================================

Do NOT add:

ADMIN

AGENT PANEL

to the website navbar.

Never.

======================================================================
PART 43 â€” PUBLIC FOOTER
======================================================================

Do NOT add:

Admin Panel
Agent Panel

to footer.

======================================================================
PART 44 â€” PUBLIC SITEMAP
======================================================================

Do not include private management panels in public sitemap.

======================================================================
PART 45 â€” ROBOTS
======================================================================

Noindex/disallow management interfaces.

======================================================================
PART 46 â€” NOW BUILD OWNER ADMIN SYSTEM
======================================================================

The OWNER ADMIN PANEL is completely separate from Customer Access.

It is for the business owner only.

Admin panel must have almost complete control over the website and
platform data.

However:

do NOT link it publicly.

======================================================================
PART 47 â€” ADMIN PANEL SECURITY PRINCIPLE
======================================================================

A secret URL alone is NOT security.

The owner requested no visible login page.

Respect that UX while keeping actual security.

Implement:

NO PUBLIC LOGIN SCREEN

but use:

secure server-side owner authorization.

Recommended flow:

A private bootstrap/invite URL known only to owner establishes a secure
admin session.

The raw bootstrap token must be:
high entropy
server-validated
rotatable
revocable

After valid bootstrap:

set secure HttpOnly admin session cookie

then redirect to clean admin route.

The bootstrap secret should not remain in browser URL.

Use history replacement/redirect.

======================================================================
PART 48 â€” ADMIN NORMAL URL
======================================================================

Example clean route:

/mk-panel-admin

or configuration-based private route.

Do not assume obscurity protects it.

If unauthorized session accesses route:

do NOT show admin.

Return:
not found
or access unavailable.

Do not show a public admin login screen.

======================================================================
PART 49 â€” ADMIN SESSION
======================================================================

Admin session:

HttpOnly
Secure
SameSite
server validated
revocable

Do not store admin authorization only in localStorage.

======================================================================
PART 50 â€” ADMIN PANEL DESIGN
======================================================================

Admin panel can be highly professional.

But priority is:

control
speed
clarity

Not excessive animation.

Use same brand:

deep black
dark navy
dark crimson

Desktop-focused but responsive.

======================================================================
PART 51 â€” ADMIN PANEL MAIN NAVIGATION
======================================================================

Recommended admin sections:

OVERVIEW

CUSTOMERS

ANDROID

IPHONE

PC

AGENTS

PRODUCTS

ORDERS

PAYMENT PROOFS

RESOURCES

SITE CONTENT

DESIGN SETTINGS

PAYMENT METHODS

SUPPORT

SYSTEM SETTINGS

Do not overcrowd navbar.

Use sidebar/grouping.

======================================================================
PART 52 â€” ADMIN FULL CUSTOMIZATION GOAL
======================================================================

Owner wants control over extremely small website details.

Therefore centralize editable business/UI content.

Do not hard-code values across random components.

Admin should eventually be able to customize:

brand wording
homepage headline
homepage description
button labels
stats values
section headings
product text
support text
payment details
resource links
tutorial links
file passwords
product prices
product images
badges
visibility
order settings
customer access data

while protecting structural code.

======================================================================
PART 53 â€” ADMIN SHOULD NOT EDIT RAW CODE
======================================================================

Do not create an unsafe text field that allows arbitrary JavaScript.

Customization should be structured.

======================================================================
PART 54 â€” ADMIN OVERVIEW
======================================================================

Overview cards:

Total Customers

Android Customers

iPhone Customers

PC Customers

Active Agents

Pending Orders

Total Products

Recent Customer Creations

All values real from DB.

No fake graphs.

======================================================================
PART 55 â€” ADMIN CUSTOMER MANAGEMENT
======================================================================

Admin can:

create customer
edit customer
disable customer
re-enable customer
view platform
view package
view device registration state
change package
change password
view creation source
view agent who created account
view attached payment proof
view timestamps

======================================================================
PART 56 â€” CUSTOMER TABLE
======================================================================

Columns:

Customer ID

Platform

Package

Status

Created By

Agent

Device Registered

Created At

Last Login

Actions

======================================================================
PART 57 â€” PLATFORM FILTERS
======================================================================

Filters:

All

Android

iPhone

PC

======================================================================
PART 58 â€” CUSTOMER SEARCH
======================================================================

Search:

customer identifier

display name if used.

======================================================================
PART 59 â€” CUSTOMER PLATFORM EDIT
======================================================================

Changing customer platform must be treated carefully.

If platform is changed:

require package compatible with target platform.

Do not leave mismatched package.

======================================================================
PART 60 â€” CUSTOMER PASSWORD CHANGE
======================================================================

Owner can set new customer login password.

Hash server-side.

Do not display old authentication password.

======================================================================
PART 61 â€” CUSTOMER DEVICE MANAGEMENT
======================================================================

Admin may see:

Registered
Not Registered

First Registered Date
Last Seen

Do not display raw hash.

======================================================================
PART 62 â€” DEVICE RESET
======================================================================

Earlier customer-facing policy:

customer cannot reset their own device.

Owner admin may have a privileged:

RESET DEVICE BINDING

action if business owner wants emergency control.

This should require confirmation.

Do not make it easy to press accidentally.

======================================================================
PART 63 â€” ADMIN PLATFORM RESOURCE MANAGEMENT
======================================================================

Create dedicated tabs/pages:

ANDROID RESOURCES

IPHONE RESOURCES

PC RESOURCES

======================================================================
PART 64 â€” ANDROID RESOURCE ADMIN
======================================================================

Owner can edit:

Main File URL

File Password

Main Tutorial URL

MT Manager URL

MT Manager Tutorial URL

Shizuku URL

Shizuku Tutorial URL

Version

Availability

Last Updated

======================================================================
PART 65 â€” IPHONE RESOURCE ADMIN
======================================================================

Owner can edit:

iPhone File URL

iPhone Tutorial URL

Availability

Version

Last Updated

Do not force password field if iPhone currently doesn't use it.

======================================================================
PART 66 â€” PC RESOURCE ADMIN
======================================================================

Owner can edit:

PC File URL

PC File Password

Availability

Version

Last Updated

======================================================================
PART 67 â€” TEST RESOURCE LINK
======================================================================

Admin resource editor may include:

TEST LINK

Opens safely.

Does not save.

======================================================================
PART 68 â€” ADMIN PRODUCT MANAGEMENT
======================================================================

Preserve existing product system.

Allow owner to:

create
edit
disable
feature
delete/archive
change name
description
price
old price
image
badge
sort
category
delivery info

======================================================================
PART 69 â€” ADMIN SITE CONTENT
======================================================================

Central editing sections for:

Hero Eyebrow

Hero Main Heading

Hero Description

Primary CTA Label

Secondary CTA Label

Products Heading

Customer Access Heading

Stats Labels

How It Works Copy

Benefits Copy

Support CTA Copy

Footer Description

======================================================================
PART 70 â€” DESIGN SETTINGS
======================================================================

Allow controlled customization such as:

primary blue accent

dark red accent

card intensity

glow intensity

animation intensity

intro enabled/disabled

intro duration within safe limits

Do not expose arbitrary CSS editor initially.

======================================================================
PART 71 â€” ADMIN STATS
======================================================================

Editable:

Clients Served

Active Customers

Current initial values may remain:

400+

120+

======================================================================
PART 72 â€” ADMIN SUPPORT
======================================================================

Owner can edit:

support WhatsApp URL
support phone
support email if used
default support message

======================================================================
PART 73 â€” ADMIN PAYMENT METHODS
======================================================================

Owner can manage:

payment method name

account title

account number

instructions

QR

active status

sort order

======================================================================
PART 74 â€” ADMIN ORDERS
======================================================================

Existing store orders should remain manageable.

Statuses:

Pending Verification
Approved
Delivered
Rejected
Cancelled

======================================================================
PART 75 â€” ADMIN PAYMENT PROOFS
======================================================================

Payment proofs from normal store buyers remain private.

Agent-created account payment proofs also appear clearly but should be
distinguishable.

Example:

SOURCE:

STORE ORDER

or

AGENT CUSTOMER CREATION

======================================================================
PART 76 â€” CUSTOMER CREATION SOURCE
======================================================================

Every customer record should track:

created_source

Possible values:

OWNER_ADMIN
AGENT_PANEL
SYSTEM
MIGRATED

and:

created_by_agent_id nullable

======================================================================
PART 77 â€” ADMIN AGENT MANAGEMENT
======================================================================

Owner admin can:

create agent
name agent
disable agent
revoke access
issue access link
rotate access
view created customers
view payment proofs submitted by agent
view platform breakdown
view creation count

======================================================================
PART 78 â€” AGENT PANEL CORE PRINCIPLE
======================================================================

Agent panel is NOT a smaller admin panel.

It is a highly restricted customer-creation tool.

Agent must NOT be able to:

edit website
edit products
edit prices
edit resources
edit file links
edit tutorials
see all customers
see other agents
see admin settings
see site customization
change statistics
change payment methods
view private owner controls

======================================================================
PART 79 â€” AGENT PANEL URL
======================================================================

Example clean route:

/agent-panel

or configurable private route.

There must be:

NO PUBLIC WEBSITE BUTTON

NO NAV LINK

NO FOOTER LINK

NO PUBLIC SITEMAP LINK

======================================================================
PART 80 â€” AGENT PANEL LOGIN UX
======================================================================

Owner requested:

NO VISIBLE LOGIN PAGE.

Respect this.

But do not rely only on secret route.

Use secure agent invitation/access session.

Recommended:

Each agent receives unique private invite/access link.

Example conceptual:

private signed URL

When opened:

server verifies agent token

server verifies agent active status

creates secure HttpOnly agent session

redirects to clean:

/agent-panel

Remove secret token from browser URL after authentication.

The agent sees no username/password login page.

======================================================================
PART 81 â€” AGENT ACCESS SECURITY
======================================================================

Every agent must have separate identity.

Do NOT share one universal agent token.

This is important so owner can know:

which agent created which customer.

======================================================================
PART 82 â€” AGENT REVOCATION
======================================================================

Owner can revoke one agent without affecting others.

If agent disabled:

existing agent session should become invalid or expire quickly.

======================================================================
PART 83 â€” AGENT PANEL SPEED
======================================================================

Agent panel should feel extremely fast.

Minimal heavy decorative effects.

No giant hero animation.

No cinematic intro.

No particles everywhere.

No unnecessary marketing content.

It is a working tool.

======================================================================
PART 84 â€” AGENT PANEL VISUAL THEME
======================================================================

Still make it professional.

Theme:

deep black
dark navy blue
dark crimson red

Use:

clean glass panels
soft borders
small glows
professional icons
quick micro-interactions

Not boring.

Not over-animated.

======================================================================
PART 85 â€” AGENT PANEL TOP AREA
======================================================================

Header:

MK PANEL ZONE

small label:

AGENT PANEL

Agent display name.

Optional status:

ACTIVE

Right:

LOG OUT

======================================================================
PART 86 â€” AGENT PANEL MAIN PURPOSE
======================================================================

One clear heading:

CREATE CUSTOMER ACCESS

Supporting text:

Select a platform and create access for your customer.

======================================================================
PART 87 â€” AGENT PLATFORM SELECTION
======================================================================

Exactly three choices:

ANDROID

IPHONE

PC

Use large professional selection cards or segmented controls.

======================================================================
PART 88 â€” PLATFORM SELECTION IS REQUIRED
======================================================================

Agent cannot create account until one is selected.

======================================================================
PART 89 â€” ANDROID AGENT CREATION
======================================================================

Agent chooses:

ANDROID

Form then displays:

CUSTOMER ID

PASSWORD

PAYMENT RECEIPT

CREATE CUSTOMER

======================================================================
PART 90 â€” IPHONE AGENT CREATION
======================================================================

Agent chooses:

IPHONE

Same fields:

CUSTOMER ID

PASSWORD

PAYMENT RECEIPT

CREATE CUSTOMER

The platform association becomes:

IOS.

======================================================================
PART 91 â€” PC AGENT CREATION
======================================================================

Agent chooses:

PC

Fields:

CUSTOMER ID

PASSWORD

PAYMENT RECEIPT

CREATE CUSTOMER

platform_type:

PC

======================================================================
PART 92 â€” CUSTOMER ID IS AGENT-DEFINED
======================================================================

Do NOT randomly generate customer ID.

Agent asks customer and enters the chosen ID.

======================================================================
PART 93 â€” PASSWORD IS AGENT-DEFINED
======================================================================

Do NOT randomly generate password unless future feature requested.

Agent enters customer-agreed password.

======================================================================
PART 94 â€” PASSWORD STORAGE
======================================================================

Authentication password must be hashed.

Never store authentication password plaintext.

Use Argon2id or secure password hashing implementation.

======================================================================
PART 95 â€” AGENT PAYMENT RECEIPT
======================================================================

Agent must upload payment receipt/screenshot before customer can be
created.

Allowed:

JPG
JPEG
PNG
WEBP

Recommended max:

5MB

======================================================================
PART 96 â€” RECEIPT PURPOSE
======================================================================

This screenshot proves/records the business transaction handled by the
agent.

It is an audit attachment.

It does NOT need to be publicly visible.

======================================================================
PART 97 â€” AGENT RECEIPT STORAGE
======================================================================

Store payment proof in PRIVATE storage.

Never public bucket.

======================================================================
PART 98 â€” AGENT RECEIPT FILE NAME
======================================================================

Generate safe server-side random storage name.

Do not trust original filename.

======================================================================
PART 99 â€” AGENT FORM VALIDATION
======================================================================

Require:

platform

customer ID

password

payment receipt

Agent cannot submit with missing field.

======================================================================
PART 100 â€” CUSTOMER ID UNIQUE
======================================================================

Customer ID must be globally unique unless architecture explicitly
supports scoped IDs.

Preferred:

globally unique.

If duplicate:

show:

CUSTOMER ID ALREADY EXISTS

Choose another customer ID.

======================================================================
PART 101 â€” AGENT PASSWORD REQUIREMENT
======================================================================

Apply reasonable minimum strength.

Do not demand extremely complicated password if business workflow needs
simplicity.

Example:

minimum 6â€“8 characters.

Allow owner to configure later.

======================================================================
PART 102 â€” CREATE BUTTON
======================================================================

Main CTA:

CREATE CUSTOMER

Normal:

CREATE CUSTOMER

Submitting:

CREATING...

Success:

CUSTOMER CREATED

======================================================================
PART 103 â€” CREATE TRANSACTION
======================================================================

Customer creation should be atomic where practical.

Process:

1. validate agent session
2. verify agent active
3. validate platform
4. validate customer ID
5. validate password
6. validate screenshot
7. upload private receipt
8. find correct default package for selected platform
9. hash password
10. create customer
11. assign platform
12. assign package
13. store creation source
14. store agent ID
15. link payment proof
16. commit transaction
17. return success

Avoid partial broken records.

======================================================================
PART 104 â€” PLATFORM DEFAULT PACKAGE
======================================================================

Agent does not need to select complex package in initial version.

Each platform can have a default agent-created package.

ANDROID:

default Android package.

IPHONE:

default iPhone package.

PC:

default PC package.

Owner can configure defaults in admin.

======================================================================
PART 105 â€” SUCCESS RESULT
======================================================================

After successful creation:

replace form or show success panel.

Heading:

CUSTOMER CREATED

Show:

Platform

Customer ID

Password

Access URL

Buttons:

COPY ACCESS DETAILS

CREATE ANOTHER CUSTOMER

======================================================================
PART 106 â€” PASSWORD SUCCESS DISPLAY
======================================================================

Since agent just entered password:

it can be shown in immediate success response using the submitted value
held only for the current form/session.

Do NOT retrieve plaintext password from database.

Do NOT persist plaintext solely for this feature.

======================================================================
PART 107 â€” COPY ACCESS DETAILS
======================================================================

Copy format:

MK Panel Zone Customer Access

Platform: Android
Customer ID: [ID]
Password: [PASSWORD]
Access: [CUSTOMER ACCESS URL]

For iPhone:

Platform: iPhone

For PC:

Platform: PC

======================================================================
PART 108 â€” CUSTOMER ACCESS URL
======================================================================

Prefer general:

https://domain/access

The customer then selects their platform.

Optionally platform-specific URL may preselect:

/access?platform=android

but general access should work.

======================================================================
PART 109 â€” AGENT CREATE ANOTHER
======================================================================

Click:

CREATE ANOTHER CUSTOMER

Reset:

customer ID
password
receipt

Keep or reset selected platform depending best UX.

Prefer keeping platform for agents creating multiple same-type accounts.

Provide:

CHANGE PLATFORM.

======================================================================
PART 110 â€” AGENT CREATION HISTORY
======================================================================

Agent panel may show a SMALL recent activity area.

Only the agent's own recently created customers.

Do not show all company customers.

Suggested:

last 10 creations.

Columns:

Customer ID
Platform
Time
Status

Do not show customer passwords.

======================================================================
PART 111 â€” AGENT CANNOT EDIT CREATED CUSTOMER
======================================================================

Initial agent permissions:

CREATE only.

After creation agent should not be able to:

change password
change platform
delete account
reset device
edit resources

Owner admin handles changes.

======================================================================
PART 112 â€” AGENT CANNOT VIEW PASSWORD LATER
======================================================================

After the success screen is gone:

password is not retrievable.

This is correct because database stores only hash.

======================================================================
PART 113 â€” AGENT RECEIPT PREVIEW
======================================================================

Before create:

show receipt preview.

Actions:

CHANGE

REMOVE

======================================================================
PART 114 â€” AGENT DRAG/DROP
======================================================================

Desktop:

support drag/drop.

Mobile:

normal file picker/gallery.

======================================================================
PART 115 â€” AGENT FORM MOBILE
======================================================================

Must work extremely well on mobile because agents may operate from
phones.

Single-column.

Large controls.

Fast.

No heavy animations.

======================================================================
PART 116 â€” AGENT PANEL RESPONSE SPEED
======================================================================

Target minimal client overhead.

Do not import full homepage motion system unnecessarily.

======================================================================
PART 117 â€” AGENT PANEL ANIMATION RULE
======================================================================

Allowed:

200ms card hover

quick tab switch

small success check animation

toast

button press

Not allowed:

3-second intro

floating background panels

constant huge particles

heavy parallax

video background

======================================================================
PART 118 â€” AGENT PANEL BACKGROUND
======================================================================

Near black.

One large soft dark-blue glow.

One smaller dark-red glow.

Very faint grid.

No distracting moving background.

======================================================================
PART 119 â€” AGENT PLATFORM CARD DESIGN
======================================================================

Selected card:

slightly brighter border

small check

blue/red subtle glow

Unselected:

muted.

======================================================================
PART 120 â€” AGENT ID INPUT
======================================================================

Label:

CUSTOMER ID

Helper:

Enter the ID agreed with the customer.

======================================================================
PART 121 â€” AGENT PASSWORD INPUT
======================================================================

Label:

PASSWORD

Eye toggle.

======================================================================
PART 122 â€” AGENT RECEIPT INPUT
======================================================================

Label:

PAYMENT RECEIPT

Helper:

Upload the payment receipt for this customer.

======================================================================
PART 123 â€” AGENT ERROR MESSAGES
======================================================================

Specific:

Customer ID is required.

Password is required.

Payment receipt is required.

Invalid image format.

Customer ID already exists.

Unable to create customer. Try again.

======================================================================
PART 124 â€” AGENT SUCCESS TOAST
======================================================================

Customer created successfully.

But primary success panel should still display credentials for copying.

======================================================================
PART 125 â€” AGENT LOGOUT
======================================================================

LOG OUT

Destroy only agent session.

======================================================================
PART 126 â€” AGENT CUSTOMER PLATFORM ENFORCEMENT
======================================================================

If agent creates:

platform = ANDROID

the created customer MUST have:

platform_type = ANDROID

default Android package.

This cannot be changed by client-side request manipulation.

Server determines from validated input.

======================================================================
PART 127 â€” EXAMPLE ANDROID CUSTOMER
======================================================================

Agent creates:

Platform:
Android

ID:
ALI-Y6

Password:
sample-secret

Receipt:
receipt.jpg

Server creates:

customer_identifier = ALI-Y6

platform_type = ANDROID

package = default Android

created_source = AGENT_PANEL

created_by_agent_id = current agent

======================================================================
PART 128 â€” ANDROID ID ON IPHONE LOGIN
======================================================================

Customer goes:

Customer Access

selects iPhone

enters:

ALI-Y6

correct password.

Server verifies credentials.

Detects:

actual platform ANDROID.

Return:

WRONG PLATFORM

This access belongs to Android.

Button:

GO TO ANDROID ACCESS

======================================================================
PART 129 â€” ANDROID ID ON PC
======================================================================

Same logic.

======================================================================
PART 130 â€” IPHONE ID ON ANDROID
======================================================================

Same logic.

======================================================================
PART 131 â€” PC ID ON ANDROID
======================================================================

Same logic.

======================================================================
PART 132 â€” WRONG PLATFORM MUST NOT CREATE DEVICE BINDING
======================================================================

Critical.

If customer chooses wrong platform:

DO NOT register that device/platform attempt as first activation.

Device binding only happens AFTER:

credentials valid
platform correct.

======================================================================
PART 133 â€” FAILED PASSWORD MUST NOT BIND DEVICE
======================================================================

Critical.

======================================================================
PART 134 â€” FIRST CORRECT LOGIN BINDS DEVICE
======================================================================

Yes.

======================================================================
PART 135 â€” AGENT ACCOUNT ACCESS DOES NOT AFFECT CUSTOMER DEVICE
======================================================================

Agent creating account should not register customer device.

Customer's first login registers customer device.

======================================================================
PART 136 â€” ADMIN VIEW AGENT-CREATED CUSTOMER
======================================================================

Owner should see:

Customer ID

Platform

Created by:

Agent Name

Receipt:

View

Created:

date/time

Device:

Not Registered initially

======================================================================
PART 137 â€” ADMIN AGENT STATISTICS
======================================================================

Per agent:

Total Customers Created

Android

iPhone

PC

Last Creation

Status

No fake sales metrics.

======================================================================
PART 138 â€” AGENT PAYMENT RECEIPTS
======================================================================

Admin can view receipts submitted by agent.

Use signed/private storage access.

Do not make permanent public URL.

======================================================================
PART 139 â€” AGENT DISABLE
======================================================================

Admin action:

DISABLE AGENT

Requires confirmation.

After disable:

agent cannot create accounts.

======================================================================
PART 140 â€” AGENT ACCESS ROTATION
======================================================================

Admin can:

REVOKE ACCESS

GENERATE NEW ACCESS

Existing token/session becomes invalid where practical.

======================================================================
PART 141 â€” AGENT SESSION TTL
======================================================================

Use a reasonable expiry.

Because there is no login UI:

agent can use their private access link again when needed if still
valid, or owner can issue new link.

Do not create permanent unrevocable browser authorization.

======================================================================
PART 142 â€” ADMIN OWNER ACCESS
======================================================================

Similarly:

owner should have secure revocable admin access.

No visible login page required.

But never rely solely on:

/secret-admin-url

as security.

======================================================================
PART 143 â€” ROLE MODEL
======================================================================

Clearly separate:

CUSTOMER

AGENT

OWNER_ADMIN

Do not use one giant role with frontend conditions.

======================================================================
PART 144 â€” SERVER AUTHORIZATION
======================================================================

Every protected action checks role server-side.

Customer cannot call agent actions.

Agent cannot call admin actions.

Customer cannot call admin actions.

Agent cannot fetch all customers.

======================================================================
PART 145 â€” AGENT CREATE ENDPOINT
======================================================================

Must require:

valid AGENT session.

======================================================================
PART 146 â€” ADMIN UPDATE ENDPOINT
======================================================================

Must require:

OWNER_ADMIN session.

======================================================================
PART 147 â€” CUSTOMER DOWNLOAD ENDPOINT
======================================================================

Must require:

CUSTOMER session
matching platform
matching package
matching device.

======================================================================
PART 148 â€” DATABASE AGENTS TABLE
======================================================================

Recommended:

agents

id UUID

display_name

status

access_version

created_at

updated_at

last_access_at

disabled_at nullable

Do not store reusable raw access tokens.

======================================================================
PART 149 â€” AGENT ACCESS TOKENS
======================================================================

Store hashed token values if token-based bootstrap is used.

Token should be:

cryptographically random
high entropy
single-agent
revocable

======================================================================
PART 150 â€” AGENT CUSTOMER RELATIONSHIP
======================================================================

customers:

created_by_agent_id nullable foreign key â†’ agents.id

======================================================================
PART 151 â€” CREATION PROOF TABLE
======================================================================

Recommended:

customer_creation_proofs

id

customer_id

agent_id

storage_path

mime_type

file_size

created_at

This keeps proof separate and organized.

======================================================================
PART 152 â€” CUSTOMER PLATFORM ENUM
======================================================================

Prefer database enum:

ANDROID
IOS
PC

or controlled check constraint.

======================================================================
PART 153 â€” SESSION ROLES
======================================================================

Do not allow customer session cookie to be interpreted as agent/admin.

Separate session namespace or role claims securely.

======================================================================
PART 154 â€” COOKIE NAMES
======================================================================

Example conceptual:

customer_session

agent_session

owner_session

Use secure production naming.

======================================================================
PART 155 â€” SESSION COOKIE SECURITY
======================================================================

HttpOnly

Secure

SameSite

reasonable expiry

server validation

======================================================================
PART 156 â€” NO MANAGEMENT TOKEN IN LOCALSTORAGE
======================================================================

Do not store owner/agent authorization in localStorage.

======================================================================
PART 157 â€” TOKEN URL CLEANUP
======================================================================

If private invite URL contains bootstrap token:

after successful validation:

create cookie/session.

Immediately redirect to URL without token.

Do not leave token in address bar.

======================================================================
PART 158 â€” REFERRER SECURITY
======================================================================

Use suitable Referrer-Policy so sensitive bootstrap links do not leak.

======================================================================
PART 159 â€” MANAGEMENT PAGES NOINDEX
======================================================================

Admin and agent routes:

noindex

no sitemap

no public navigation.

======================================================================
PART 160 â€” SECURITY HEADERS
======================================================================

Maintain/add:

Content-Security-Policy where practical

X-Content-Type-Options

Referrer-Policy

frame protection

Permissions-Policy

======================================================================
PART 161 â€” AGENT RECEIPT SECURITY
======================================================================

Only:

owner/admin

and optionally the creating agent during immediate upload preview

should access private stored receipt.

Agent does not need permanent receipt gallery unless explicitly
implemented as own recent history.

======================================================================
PART 162 â€” RECEIPT IMAGE VALIDATION
======================================================================

Validate:

MIME type

size

decode if possible

Do not accept:

SVG
HTML
JS
ZIP
EXE

======================================================================
PART 163 â€” AGENT CUSTOMER CREATION RATE LIMIT
======================================================================

Apply sensible anti-abuse limits.

But do not make legitimate agents wait after every creation.

======================================================================
PART 164 â€” DUPLICATE SUBMISSION
======================================================================

Prevent double-click from creating two customer accounts.

Use idempotency/disabled submit.

======================================================================
PART 165 â€” CUSTOMER ID NORMALIZATION
======================================================================

Trim whitespace.

Define case behavior.

Example preferred:

case-insensitive lookup.

Do not allow:

ALI123

and

ali123

as two confusing accounts unless intentionally designed.

======================================================================
PART 166 â€” PLATFORM SELECTION DATABASE SAFETY
======================================================================

Use server enum validation.

Never accept arbitrary:

platform = "SUPERADMIN"

from frontend.

======================================================================
PART 167 â€” ADMIN CUSTOMIZATION SAFETY
======================================================================

Owner can customize content/settings but not execute arbitrary scripts
through admin forms.

Do not create editable JS injection field.

======================================================================
PART 168 â€” SITE CONTENT DATA MODEL
======================================================================

Create structured site settings.

Possible fields:

hero_eyebrow

hero_title

hero_description

primary_cta_text

secondary_cta_text

products_heading

access_heading

how_it_works_heading

support_heading

footer_description

client_count

active_customer_count

support_url

======================================================================
PART 169 â€” DESIGN CONFIG
======================================================================

Structured:

accent_blue

accent_red

glow_strength

motion_level

intro_enabled

intro_duration

Do not allow values that destroy usability.

======================================================================
PART 170 â€” BUTTON TEXT CUSTOMIZATION
======================================================================

Owner may edit major CTA labels.

But preserve fallback values if blank.

======================================================================
PART 171 â€” HOMEPAGE SECTION VISIBILITY
======================================================================

Owner can toggle:

products preview

stats

how it works

benefits

support CTA

Do not let disabling sections break navigation.

======================================================================
PART 172 â€” ADMIN PRODUCT IMAGE UPLOAD
======================================================================

If existing product editor already supports image:
preserve.

If not:
add secure image upload.

======================================================================
PART 173 â€” ADMIN RESOURCE PASSWORD
======================================================================

Resource file password is NOT customer authentication password.

Keep fields separate.

======================================================================
PART 174 â€” ADMIN CUSTOMER PASSWORD
======================================================================

Authentication password should not be retrievable.

Admin can SET a new password, not reveal old password.

======================================================================
PART 175 â€” PLATFORM DEFAULT PACKAGES SETTINGS
======================================================================

Owner can configure:

Default Agent Android Package

Default Agent iPhone Package

Default Agent PC Package

======================================================================
PART 176 â€” AGENT CANNOT CHOOSE SECRET PACKAGE
======================================================================

Initial version:

agent chooses only platform.

Server automatically chooses configured default package.

This prevents incorrect resource assignment.

======================================================================
PART 177 â€” FUTURE AGENT PACKAGE CHOICE
======================================================================

Architecture may support later, but do not expose now.

======================================================================
PART 178 â€” AGENT PANEL UX PRIORITY
======================================================================

Agent should be able to create a customer in seconds.

Desired workflow:

Open agent panel

Select Android/iPhone/PC

Enter ID

Enter password

Upload receipt

Create

Copy credentials

Done.

No extra pages.

======================================================================
PART 179 â€” AGENT PANEL SHOULD MOSTLY BE ONE SCREEN
======================================================================

Desktop:

platform selection top.

Creation form center.

Recent activity small lower section.

Mobile:

same vertically.

======================================================================
PART 180 â€” NO AGENT SIDEBAR IF UNNECESSARY
======================================================================

Since agent has limited functions:

do not create complex admin-like sidebar.

Keep it simple.

======================================================================
PART 181 â€” AGENT PANEL HEADER
======================================================================

Compact.

Height:

~64â€“72px.

Brand left.

Agent name/status center/right.

Logout right.

======================================================================
PART 182 â€” AGENT PANEL CARD
======================================================================

Large main card.

Glass but high contrast.

Inputs easy to see.

======================================================================
PART 183 â€” AGENT PLATFORM SELECTOR DESKTOP
======================================================================

Three equal horizontal cards/buttons:

Android
iPhone
PC

======================================================================
PART 184 â€” AGENT PLATFORM SELECTOR MOBILE
======================================================================

Either three compact buttons or stacked cards.

Do not squeeze text.

======================================================================
PART 185 â€” AGENT PLATFORM ICONS
======================================================================

Android:
phone.

iPhone:
phone / apple-device neutral icon.

PC:
monitor.

Use consistent Lucide-style icons.

======================================================================
PART 186 â€” AGENT FORM ANIMATION
======================================================================

Switch platform:

quick 180â€“250ms content transition.

No page refresh.

======================================================================
PART 187 â€” AGENT SUCCESS ANIMATION
======================================================================

Small checkmark draw.

Duration:

~350ms.

No confetti.

======================================================================
PART 188 â€” AGENT RECEIPT DROPZONE
======================================================================

Dark panel.

Dashed/subtle border.

When dragging:

border brightens blue.

======================================================================
PART 189 â€” AGENT CREATE BUTTON DESIGN
======================================================================

Full width or prominent.

Dark navy.

Blue top edge.

Crimson lower-edge reflection.

Text:

CREATE CUSTOMER

Fast hover.

======================================================================
PART 190 â€” AGENT NO PRODUCT SALES UI
======================================================================

Do not show product catalog inside agent panel.

======================================================================
PART 191 â€” AGENT NO WEBSITE SETTINGS
======================================================================

Never.

======================================================================
PART 192 â€” AGENT NO RESOURCE URL
======================================================================

Never.

======================================================================
PART 193 â€” AGENT NO CUSTOMER LIST
======================================================================

Only own recent creations if included.

No full customer directory.

======================================================================
PART 194 â€” AGENT NO DEVICE RESET
======================================================================

Never.

======================================================================
PART 195 â€” AGENT NO DELETE
======================================================================

Never.

======================================================================
PART 196 â€” AGENT NO PASSWORD CHANGE AFTER CREATE
======================================================================

Never.

======================================================================
PART 197 â€” AGENT NO PLATFORM CHANGE AFTER CREATE
======================================================================

Never.

======================================================================
PART 198 â€” OWNER ADMIN IS SUPERSET
======================================================================

Owner can see/manage everything.

Agent has very narrow permissions.

======================================================================
PART 199 â€” EXISTING PUBLIC STORE MUST NOT BREAK
======================================================================

Regression test:

homepage
products
product detail
checkout
customer access
support
footer
animations

all must continue working.

======================================================================
PART 200 â€” PRESERVE EXISTING PUBLIC UI
======================================================================

User explicitly wants current UI to remain.

Therefore:

DO NOT radically redesign homepage.

DO NOT replace current colors.

DO NOT remove current sections.

DO NOT replace existing working animations unless broken.

New platform selection must visually match existing site.

======================================================================
PART 201 â€” ONLY IMPROVE IF REQUIRED
======================================================================

If a new control looks inconsistent:

style the new control to match existing UI.

Do not restyle entire project.

======================================================================
PART 202 â€” CUSTOMER ACCESS TRANSITION
======================================================================

Existing access card may be reused.

Add platform selection before it.

Use smooth transition.

======================================================================
PART 203 â€” PLATFORM BACK BUTTON
======================================================================

Login form:

small:

â† Change Platform

Fast.

======================================================================
PART 204 â€” PLATFORM PREFILL
======================================================================

If URL contains safe platform query:

/access?platform=android

preselect Android.

Still validate enum.

======================================================================
PART 205 â€” CUSTOMER WRONG PLATFORM CTA
======================================================================

If actual platform Android:

GO TO ANDROID ACCESS

automatically preselect Android.

Do not make customer return home.

======================================================================
PART 206 â€” SESSION REDIRECT
======================================================================

If already authenticated customer goes to /access:

may redirect to their correct dashboard.

======================================================================
PART 207 â€” CUSTOMER DASHBOARD CROSS-PLATFORM ATTACK
======================================================================

Android session requesting iOS resource:

deny.

======================================================================
PART 208 â€” RESOURCE API PLATFORM CHECK
======================================================================

Server verifies:

resource.package.platform_type
=
customer.platform_type.

======================================================================
PART 209 â€” CUSTOMER PACKAGE PLATFORM CHECK
======================================================================

Enforce in service layer.

======================================================================
PART 210 â€” DOWNLOAD SIGNED URL PLATFORM CHECK
======================================================================

Before signing.

======================================================================
PART 211 â€” FILE PASSWORD PLATFORM CHECK
======================================================================

Before returning secret.

======================================================================
PART 212 â€” TUTORIAL PLATFORM CHECK
======================================================================

Before protected response if applicable.

======================================================================
PART 213 â€” ANDROID LOGIN RESPONSE
======================================================================

redirect:
Android dashboard.

======================================================================
PART 214 â€” IPHONE LOGIN RESPONSE
======================================================================

redirect:
iPhone dashboard.

======================================================================
PART 215 â€” PC LOGIN RESPONSE
======================================================================

redirect:
PC dashboard.

======================================================================
PART 216 â€” CUSTOMER SESSION REFRESH
======================================================================

Refresh must preserve correct platform session.

======================================================================
PART 217 â€” CUSTOMER LOGOUT
======================================================================

Works from all platform dashboards.

======================================================================
PART 218 â€” CUSTOMER DEVICE BINDING MIGRATION
======================================================================

Preserve existing registered device data.

Do not force existing Android customers to re-register unless required.

======================================================================
PART 219 â€” EXISTING LOGIN URL
======================================================================

Do not break bookmarks unnecessarily.

======================================================================
PART 220 â€” LEGACY LOGIN
======================================================================

If old route directly opened login:

redirect it to platform selection or default Android only if required
for backward compatibility.

Preferred:

platform selection.

======================================================================
PART 221 â€” ADMIN URL NOT PUBLIC
======================================================================

Never render owner route inside HTML links visible publicly.

======================================================================
PART 222 â€” AGENT URL NOT PUBLIC
======================================================================

Same.

======================================================================
PART 223 â€” PRIVATE ROUTE NAMES CONFIGURABLE
======================================================================

Optional environment/config setting.

But security remains session-based.

======================================================================
PART 224 â€” MANAGEMENT 404 BEHAVIOR
======================================================================

Unauthorized request may return generic 404.

Do not reveal:

Admin exists here.

======================================================================
PART 225 â€” OWNER BOOTSTRAP
======================================================================

Document secure initial owner access setup in README.

Do not hard-code token in repository.

======================================================================
PART 226 â€” AGENT INVITES
======================================================================

Owner generates/revokes through admin panel.

======================================================================
PART 227 â€” AGENT INVITE COPY
======================================================================

Owner sees:

Agent access link

COPY

Link must be treated as private.

======================================================================
PART 228 â€” AGENT INVITE ROTATION
======================================================================

Generating new access invalidates old bootstrap token if configured.

======================================================================
PART 229 â€” AGENT ACCESS DEVICE BINDING OPTIONAL
======================================================================

Do not force agent one-device binding unless owner wants it.

But architecture can support:

allowed_device_binding = false/true.

Default can remain false for agent operational convenience.

======================================================================
PART 230 â€” ADMIN DEVICE SECURITY
======================================================================

Owner session security should be strong.

Optional owner device binding can be added internally.

Do not make recovery impossible without documentation.

======================================================================
PART 231 â€” ADMIN AUDIT LOG
======================================================================

Create useful audit events:

customer created

customer changed

device reset

agent created

agent disabled

resource changed

product changed

payment method changed

Do not log secrets.

======================================================================
PART 232 â€” AGENT AUDIT LOG
======================================================================

Log:

agent_id

customer_id

platform

receipt proof ID

timestamp

action:
CUSTOMER_CREATED

======================================================================
PART 233 â€” ADMIN AUDIT VIEW
======================================================================

Owner can inspect recent management activity.

======================================================================
PART 234 â€” PASSWORD LOGGING
======================================================================

NEVER log customer password.

======================================================================
PART 235 â€” RECEIPT LOGGING
======================================================================

Never log receipt binary/base64.

======================================================================
PART 236 â€” TOKEN LOGGING
======================================================================

Never log full admin/agent token.

======================================================================
PART 237 â€” CLIENT BUNDLE SECURITY
======================================================================

Verify client bundle does not include:

service role key

owner secret

agent token hashes

session secret

device hashing secret

private resource passwords

======================================================================
PART 238 â€” DATABASE RLS / SERVER ACCESS
======================================================================

Use appropriate server authorization/RLS.

Agent browser cannot query customer database directly without scoped
server action.

======================================================================
PART 239 â€” CUSTOMER CREATION SERVER ACTION
======================================================================

Agent UI calls server action/API.

Server checks agent.

No direct unrestricted INSERT from browser.

======================================================================
PART 240 â€” ADMIN MUTATIONS
======================================================================

All privileged.

======================================================================
PART 241 â€” RECEIPT STORAGE ACCESS
======================================================================

Use signed access for owner.

======================================================================
PART 242 â€” CUSTOMER RECEIPT NOT VISIBLE
======================================================================

Customer does not need to see agent's payment proof.

======================================================================
PART 243 â€” AGENT RECEIPT RETENTION
======================================================================

Data model supports later retention/cleanup policy.

======================================================================
PART 244 â€” CUSTOMER ID CREATION SUCCESS RACE
======================================================================

Use database uniqueness constraint.

If two agents try same ID:

one succeeds.

other gets:

CUSTOMER ID ALREADY EXISTS.

======================================================================
PART 245 â€” DEFAULT PLATFORM PACKAGE MISSING
======================================================================

If agent selects platform but owner has not configured default package:

do NOT create broken customer.

Show:

Platform package is not configured. Contact the owner.

Do not expose technical error.

======================================================================
PART 246 â€” RESOURCE MISSING
======================================================================

Customer dashboard:

Currently unavailable.

No crash.

======================================================================
PART 247 â€” AGENT SESSION EXPIRED
======================================================================

Do not show public login.

Show:

ACCESS EXPIRED

Contact the owner for a new agent access link.

or generic access unavailable.

======================================================================
PART 248 â€” ADMIN SESSION EXPIRED
======================================================================

Owner needs private bootstrap route/link again.

Document process.

======================================================================
PART 249 â€” OWNER CAN REVOKE ALL AGENT SESSIONS
======================================================================

Useful global emergency control.

======================================================================
PART 250 â€” OWNER CAN DISABLE CUSTOMER
======================================================================

Disabled customer cannot login.

======================================================================
PART 251 â€” OWNER CAN FILTER BY AGENT
======================================================================

Customer page:

Agent:
All
[Agent names]

======================================================================
PART 252 â€” OWNER CAN FILTER BY CREATION SOURCE
======================================================================

Admin
Agent
Migrated.

======================================================================
PART 253 â€” OWNER CUSTOMER DETAIL
======================================================================

Show:

ID

Platform

Package

Status

Creation source

Agent

Receipt

Device status

Created at

Last login

======================================================================
PART 254 â€” ADMIN UI RESPONSIVENESS
======================================================================

Owner panel should work mobile/tablet.

But desktop can be primary.

======================================================================
PART 255 â€” AGENT PANEL MOBILE PRIMARY
======================================================================

Agent panel must be excellent mobile.

======================================================================
PART 256 â€” AGENT PHONE WIDTHS
======================================================================

Test:

360
375
390
430

======================================================================
PART 257 â€” AGENT DESKTOP WIDTHS
======================================================================

768
1024
1280
1440

======================================================================
PART 258 â€” CUSTOMER ACCESS WIDTHS
======================================================================

Same responsive testing.

======================================================================
PART 259 â€” ADMIN TABLE MOBILE
======================================================================

Convert table rows to cards when necessary.

======================================================================
PART 260 â€” ADMIN SIDEBAR MOBILE
======================================================================

Use drawer.

Agent panel should not need sidebar.

======================================================================
PART 261 â€” AGENT BUTTON SIZE
======================================================================

At least 48px.

======================================================================
PART 262 â€” AGENT INPUT FONT MOBILE
======================================================================

16px minimum to avoid iOS zoom.

======================================================================
PART 263 â€” RECEIPT PREVIEW MOBILE
======================================================================

Contain image.

No crop.

======================================================================
PART 264 â€” AGENT FILE PICKER
======================================================================

accept="image/jpeg,image/png,image/webp"

======================================================================
PART 265 â€” AGENT NO CAMERA REQUIREMENT
======================================================================

Do not require camera permission.

Normal upload only.

======================================================================
PART 266 â€” AGENT PLATFORM MEMORY
======================================================================

Optional:

remember last selected platform in harmless session state.

No security reliance.

======================================================================
PART 267 â€” AGENT CREATION FORM RESET
======================================================================

After success and Create Another:

clear ID

clear password

clear receipt.

======================================================================
PART 268 â€” CUSTOMER ACCESS COPY
======================================================================

Keep public UI text professional English.

======================================================================
PART 269 â€” AGENT UI LANGUAGE
======================================================================

Professional English.

======================================================================
PART 270 â€” ADMIN UI LANGUAGE
======================================================================

Professional English.

======================================================================
PART 271 â€” AGENT PANEL TITLE
======================================================================

MK PANEL ZONE

AGENT PANEL

======================================================================
PART 272 â€” ADMIN TITLE
======================================================================

MK PANEL ZONE

OWNER CONTROL PANEL

or:

ADMIN CONTROL

Choose professional wording.

======================================================================
PART 273 â€” NO â€œSUPER ADMINâ€ PUBLIC WORDING
======================================================================

Not necessary.

======================================================================
PART 274 â€” AGENT NO CUSTOMER PAYMENT AMOUNT FIELD
======================================================================

Current requirement only asks:

ID
Password
Receipt

Do not invent fields.

If payment amount is needed later, architecture may support it.

======================================================================
PART 275 â€” AGENT NO EMAIL FIELD
======================================================================

Not required.

======================================================================
PART 276 â€” AGENT NO PHONE FIELD
======================================================================

Not required.

======================================================================
PART 277 â€” AGENT NO CUSTOMER NAME FIELD
======================================================================

Not required unless later requested.

======================================================================
PART 278 â€” AGENT FORM EXACT REQUIRED FIELDS
======================================================================

PLATFORM

CUSTOMER ID

PASSWORD

PAYMENT RECEIPT

CREATE CUSTOMER

Keep it this simple.

======================================================================
PART 279 â€” CUSTOMER ID EXAMPLE
======================================================================

Placeholder only:

e.g. HUAWEI-Y6

Do not hard-code actual customer data.

======================================================================
PART 280 â€” PASSWORD PLACEHOLDER
======================================================================

Enter customer password.

======================================================================
PART 281 â€” RECEIPT PLACEHOLDER
======================================================================

Upload payment receipt.

======================================================================
PART 282 â€” CREATE SUCCESS CREDENTIALS
======================================================================

Show immediately.

======================================================================
PART 283 â€” COPY BUTTON
======================================================================

Copy Access Details.

======================================================================
PART 284 â€” AGENT DOES NOT NEED CUSTOMER DASHBOARD PREVIEW
======================================================================

No.

======================================================================
PART 285 â€” AGENT DOES NOT NEED RESOURCE LINKS
======================================================================

No.

======================================================================
PART 286 â€” AGENT PLATFORM PACKAGE ABSTRACTED
======================================================================

Agent should not even need to understand package internals.

======================================================================
PART 287 â€” OWNER CONFIGURES PLATFORM CONTENT
======================================================================

Yes.

======================================================================
PART 288 â€” CUSTOMER SEES PLATFORM CONTENT
======================================================================

Yes.

======================================================================
PART 289 â€” CLEAN SEPARATION
======================================================================

OWNER:
controls system.

AGENT:
creates customer access.

CUSTOMER:
uses assigned access.

======================================================================
PART 290 â€” DATA FLOW
======================================================================

OWNER configures:

Android resources
iPhone resources
PC resources

â†“

AGENT creates:

customer ID
password
platform
payment proof

â†“

SERVER assigns:

correct platform package

â†“

CUSTOMER logs in:

correct platform

â†“

SERVER verifies:

credentials
platform
device

â†“

CUSTOMER receives:

correct resources only.

======================================================================
PART 291 â€” PLATFORM RESOURCE ISOLATION
======================================================================

Never combine Android/iPhone/PC resources in one API response for
customer.

Fetch only authorized platform package.

======================================================================
PART 292 â€” WRONG PLATFORM UI FAST RESPONSE
======================================================================

After server detects wrong platform:

show clear warning immediately.

Do not redirect through multiple pages.

======================================================================
PART 293 â€” WRONG PLATFORM WARNING DESIGN
======================================================================

Use existing card UI.

Small warning icon.

Heading:

WRONG PLATFORM

Text.

Correct platform button.

Not giant red error screen.

======================================================================
PART 294 â€” CUSTOMER ACCESS SELECTION STATE
======================================================================

Selected platform visible at top of form.

Example pill:

ANDROID

======================================================================
PART 295 â€” CUSTOMER LOGIN BUTTON PLATFORM TEXT OPTIONAL
======================================================================

Can remain:

ACCESS MY FILES

Better consistency.

======================================================================
PART 296 â€” CUSTOMER DASHBOARD PLATFORM BADGE
======================================================================

Top:

ANDROID ACCESS

or equivalent.

======================================================================
PART 297 â€” ADMIN PANEL NO CINEMATIC INTRO
======================================================================

Fast startup.

======================================================================
PART 298 â€” AGENT PANEL NO CINEMATIC INTRO
======================================================================

Fast startup.

======================================================================
PART 299 â€” OWNER PANEL LOADING
======================================================================

Skeleton/fast loader.

======================================================================
PART 300 â€” AGENT PANEL LOADING
======================================================================

Minimal.

======================================================================
PART 301 â€” DATABASE MIGRATIONS FIRST
======================================================================

Before changing UI:

prepare safe migration.

======================================================================
PART 302 â€” MIGRATION BACKUP AWARENESS
======================================================================

Do not destructively recreate tables.

======================================================================
PART 303 â€” PLATFORM COLUMN DEFAULT
======================================================================

For existing customers:

ANDROID if appropriate based on existing business setup.

Document migration.

======================================================================
PART 304 â€” PACKAGE PLATFORM MIGRATION
======================================================================

Existing package:

ANDROID.

======================================================================
PART 305 â€” RESOURCE MIGRATION
======================================================================

Existing resources remain linked.

======================================================================
PART 306 â€” SESSION MIGRATION
======================================================================

Avoid invalidating all customers unnecessarily.

======================================================================
PART 307 â€” ROUTE COMPATIBILITY
======================================================================

Preserve /dashboard if external code expects it.

It can redirect to correct platform dashboard.

======================================================================
PART 308 â€” /DASHBOARD SMART REDIRECT
======================================================================

Authenticated Android:
â†’ /dashboard/android

iPhone:
â†’ /dashboard/ios

PC:
â†’ /dashboard/pc

Unauthenticated:
â†’ /access

======================================================================
PART 309 â€” DIRECT CROSS PLATFORM ROUTE
======================================================================

Logged Android user opens /dashboard/pc:

redirect /dashboard/android.

======================================================================
PART 310 â€” CUSTOMER ACCESS AUTHENTICATED
======================================================================

If already logged:

Access My Files can route directly to correct dashboard.

======================================================================
PART 311 â€” PUBLIC ACCESS PLATFORM SELECT WHEN LOGGED OUT
======================================================================

Yes.

======================================================================
PART 312 â€” SESSION PLATFORM SERVER SOURCE
======================================================================

Database/session.

Not query string.

======================================================================
PART 313 â€” AGENT ROLE SERVER SOURCE
======================================================================

Session.

======================================================================
PART 314 â€” OWNER ROLE SERVER SOURCE
======================================================================

Session.

======================================================================
PART 315 â€” ERROR HANDLING
======================================================================

Never expose:

SQL
stack traces
storage paths
token data
hashes
secret URLs

======================================================================
PART 316 â€” CUSTOMER LOGIN ERRORS
======================================================================

Invalid credentials.

Wrong platform.

Access disabled.

Device mismatch.

Too many attempts.

Service temporarily unavailable.

======================================================================
PART 317 â€” AGENT ERRORS
======================================================================

Access expired.

Agent disabled.

Duplicate customer ID.

Invalid receipt.

Upload failed.

Platform not configured.

Customer creation failed.

======================================================================
PART 318 â€” ADMIN ERRORS
======================================================================

Safe but more detailed operational messages.

Still no secrets.

======================================================================
PART 319 â€” TOAST SYSTEM
======================================================================

Use existing if available.

Do not introduce duplicate toast library.

======================================================================
PART 320 â€” AGENT TOASTS
======================================================================

Receipt uploaded.

Customer created.

Copied.

Error.

======================================================================
PART 321 â€” ADMIN TOASTS
======================================================================

Saved.

Updated.

Agent disabled.

Device reset.

Resource updated.

======================================================================
PART 322 â€” PUBLIC TOASTS
======================================================================

Preserve current behavior.

======================================================================
PART 323 â€” PERFORMANCE
======================================================================

Do not bundle admin/agent code into public homepage unnecessarily.

Use route-level splitting.

======================================================================
PART 324 â€” ADMIN BUNDLE
======================================================================

Loaded only when owner route.

======================================================================
PART 325 â€” AGENT BUNDLE
======================================================================

Loaded only agent route.

======================================================================
PART 326 â€” PUBLIC SITE PERFORMANCE
======================================================================

Must not become slower just because management systems were added.

======================================================================
PART 327 â€” AGENT IMAGE UPLOAD OPTIMIZATION
======================================================================

Upload asynchronously with useful progress if supported.

Do not block UI longer than necessary.

======================================================================
PART 328 â€” RECEIPT PROGRESS
======================================================================

Only show real progress.

Do not fake percentages.

======================================================================
PART 329 â€” CREATE AFTER UPLOAD
======================================================================

Either:

upload receipt during submit

or pre-upload with temporary token.

Choose robust implementation.

Avoid orphan files.

======================================================================
PART 330 â€” ORPHAN RECEIPTS
======================================================================

Clean up if customer creation fails after upload.

======================================================================
PART 331 â€” DATABASE TRANSACTION
======================================================================

Use transactional behavior where provider allows.

======================================================================
PART 332 â€” AGENT CUSTOMER CREATION AUDIT
======================================================================

Always capture agent ID server-side.

Never accept agent ID from client as authority.

======================================================================
PART 333 â€” CREATED AT
======================================================================

Server/database timestamp.

======================================================================
PART 334 â€” PLATFORM
======================================================================

Validated server-side.

======================================================================
PART 335 â€” PASSWORD HASH
======================================================================

Server-side.

======================================================================
PART 336 â€” RECEIPT PATH
======================================================================

Server-created.

======================================================================
PART 337 â€” DEFAULT PACKAGE
======================================================================

Server retrieved.

======================================================================
PART 338 â€” CUSTOMER STATUS
======================================================================

ACTIVE by default when agent creates, unless owner setting says otherwise.

======================================================================
PART 339 â€” OPTIONAL APPROVAL
======================================================================

Do not introduce agent customer approval queue unless owner asks.

Current requested behavior:

agent clicks CREATE

customer becomes usable immediately.

======================================================================
PART 340 â€” CUSTOMER FIRST LOGIN
======================================================================

Immediately usable after creation.

======================================================================
PART 341 â€” PAYMENT PROOF IS AUDIT
======================================================================

Does not block customer activation after agent creation under current
workflow.

======================================================================
PART 342 â€” AGENT TRUST MODEL
======================================================================

Agents are authorized staff.

Receipt exists for owner auditing.

======================================================================
PART 343 â€” CUSTOMER LOGIN AFTER AGENT CREATE
======================================================================

Should work immediately.

======================================================================
PART 344 â€” PLATFORM WRONG LOGIN AFTER CREATE
======================================================================

Correct warning.

======================================================================
PART 345 â€” CUSTOMER DEVICE BINDING AFTER CREATE
======================================================================

Not yet bound until customer's first valid login.

======================================================================
PART 346 â€” ADMIN CAN SEE NOT REGISTERED
======================================================================

Yes.

======================================================================
PART 347 â€” ADMIN CAN SEE REGISTERED
======================================================================

Yes.

======================================================================
PART 348 â€” AGENT RECENT LIST DEVICE STATUS
======================================================================

Not needed.

======================================================================
PART 349 â€” AGENT RECENT LIST PASSWORD
======================================================================

Never.

======================================================================
PART 350 â€” AGENT RECENT LIST RECEIPT
======================================================================

Optional small status only:

Receipt attached.

Do not need thumbnail.

======================================================================
PART 351 â€” ADMIN CUSTOMER PROOF VIEWER
======================================================================

Modal.

Private signed image.

======================================================================
PART 352 â€” ADMIN PROOF MODAL
======================================================================

Zoom/contain.

Download optional if needed.

======================================================================
PART 353 â€” PROOF MODAL SECURITY
======================================================================

Signed/authorized.

======================================================================
PART 354 â€” OWNER CAN FILTER AGENT PROOFS
======================================================================

Yes.

======================================================================
PART 355 â€” OWNER AGENT PAGE
======================================================================

Per agent detail:

Name
Status
Created date
Last access
Total customers
Android
iPhone
PC
Recent creations

Actions:
Disable
Revoke access
Generate new access

======================================================================
PART 356 â€” OWNER CREATE AGENT
======================================================================

Form:

Agent Display Name

Create Agent

Then generate access link.

No agent password required under invite-link model.

======================================================================
PART 357 â€” OWNER AGENT LINK
======================================================================

Show once/copy.

Store only secure hash.

======================================================================
PART 358 â€” OWNER CAN ROTATE
======================================================================

Yes.

======================================================================
PART 359 â€” AGENT PRIVATE LINK WARNING
======================================================================

Owner UI:

Keep this agent access link private.

Do not expose in public site.

======================================================================
PART 360 â€” ADMIN CUSTOMIZATION PREVIEW
======================================================================

Optional live preview for simple text/color changes.

Do not overbuild.

======================================================================
PART 361 â€” SITE SETTINGS SAVE
======================================================================

Server-side.

======================================================================
PART 362 â€” SETTINGS VALIDATION
======================================================================

Color:
hex/controlled.

Intro duration:
reasonable min/max.

Text length limits.

URLs safe.

======================================================================
PART 363 â€” ADMIN UNSAFE URL
======================================================================

Reject javascript/data URLs where unsafe.

======================================================================
PART 364 â€” PRODUCT MANAGEMENT
======================================================================

Preserve public store flow.

======================================================================
PART 365 â€” PUBLIC PRODUCTS NOT AGENT-RELATED
======================================================================

Agent panel should not automatically affect product catalog.

======================================================================
PART 366 â€” CUSTOMER ACCESS CUSTOMERS SEPARATE FROM STORE ORDERS
======================================================================

Keep clear data relationships.

======================================================================
PART 367 â€” FUTURE LINK
======================================================================

Architecture can link store order â†’ customer account later.

Do not force now.

======================================================================
PART 368 â€” OWNER CUSTOMERS CREATED MANUALLY
======================================================================

Admin should also have customer creation form.

Fields can include:

platform
customer ID
password
package
optional note

Payment receipt optional for owner.

======================================================================
PART 369 â€” OWNER CREATE CUSTOMER VS AGENT
======================================================================

Owner has more control.

Agent remains simple.

======================================================================
PART 370 â€” OWNER CUSTOMER CREATION SOURCE
======================================================================

OWNER_ADMIN.

======================================================================
PART 371 â€” ADMIN NOTES
======================================================================

Optional internal notes per customer.

Never visible to customer.

======================================================================
PART 372 â€” AGENT NOTES
======================================================================

Not required.

======================================================================
PART 373 â€” CUSTOMER DISPLAY NAME
======================================================================

Optional.

Customer identifier is core.

======================================================================
PART 374 â€” CUSTOMER LOGIN FIELD LABEL
======================================================================

CUSTOMER ID

or existing:

DEVICE / CUSTOMER NAME

Preserve current public wording unless owner changes in site settings.

======================================================================
PART 375 â€” CUSTOMER LOGIN PLATFORM BUTTONS
======================================================================

Platform selection must be obvious before ID/password.

======================================================================
PART 376 â€” PLATFORM SWITCH DOES NOT CLEAR ID OPTIONAL
======================================================================

Could preserve ID if customer selected wrong card accidentally.

Password can remain or be cleared based on safe UX.

Prefer clear password when changing platform.

======================================================================
PART 377 â€” WRONG PLATFORM AUTO-FIX
======================================================================

Button:

GO TO ANDROID

sets platform then returns login form.

Could preserve ID.

Require password re-entry or safely preserve current form in memory
only.

Choose secure simple behavior.

======================================================================
PART 378 â€” WRONG PLATFORM LOGGING
======================================================================

Can record safe event.

Do not over-log.

======================================================================
PART 379 â€” CUSTOMER DEVICE MISMATCH AFTER PLATFORM VALIDATION
======================================================================

Correct order:

credentials
platform
device.

======================================================================
PART 380 â€” WRONG PLATFORM BEFORE DEVICE BIND
======================================================================

Critical.

======================================================================
PART 381 â€” CUSTOMER PLATFORM SESSION IMMUTABLE
======================================================================

Do not allow changing session platform client-side.

======================================================================
PART 382 â€” PACKAGE PLATFORM IMMUTABLE FOR SESSION
======================================================================

Server derived.

======================================================================
PART 383 â€” CUSTOMER DASHBOARD TITLE ANDROID
======================================================================

ANDROID ACCESS

YOUR DIGITAL RESOURCES

======================================================================
PART 384 â€” IPHONE
======================================================================

IPHONE ACCESS

YOUR DIGITAL RESOURCES

======================================================================
PART 385 â€” PC
======================================================================

PC ACCESS

YOUR DIGITAL RESOURCES

======================================================================
PART 386 â€” PLATFORM-SPECIFIC DASHBOARD DESIGN
======================================================================

Use same overall dashboard shell.

Do not design three completely unrelated interfaces.

Only resources differ.

======================================================================
PART 387 â€” DASHBOARD SHELL
======================================================================

Logo

Platform badge

Support

Logout

Greeting

Resource cards

======================================================================
PART 388 â€” ANDROID GRID
======================================================================

More cards.

======================================================================
PART 389 â€” IPHONE GRID
======================================================================

Two main cards.

======================================================================
PART 390 â€” PC GRID
======================================================================

File + password.

======================================================================
PART 391 â€” IPHONE EMPTY SPACE
======================================================================

Use wider cards and contextual intro, not fake filler.

======================================================================
PART 392 â€” PC EMPTY SPACE
======================================================================

Same.

======================================================================
PART 393 â€” PUBLIC CUSTOMER ACCESS CARD UI
======================================================================

Do not introduce huge new page complexity.

Platform selection â†’ login.

======================================================================
PART 394 â€” AGENT UI CARD WIDTH
======================================================================

Desktop:

~640â€“760px main form.

======================================================================
PART 395 â€” AGENT RECENT ACTIVITY WIDTH
======================================================================

Same or wider.

======================================================================
PART 396 â€” AGENT MAIN CONTAINER
======================================================================

~1100px.

======================================================================
PART 397 â€” AGENT FORM BACKGROUND
======================================================================

High-contrast dark glass.

======================================================================
PART 398 â€” AGENT LABELS
======================================================================

Small uppercase.

======================================================================
PART 399 â€” AGENT INPUTS
======================================================================

Clean.

No animated floating labels if slower.

======================================================================
PART 400 â€” AGENT CREATE SPEED
======================================================================

After validation, response should feel immediate.

Use optimistic visual feedback carefully but do not announce success
before server confirms.

======================================================================
PART 401 â€” ADMIN ANIMATION LEVEL
======================================================================

Low-to-medium.

======================================================================
PART 402 â€” AGENT ANIMATION LEVEL
======================================================================

Low.

======================================================================
PART 403 â€” PUBLIC ANIMATION LEVEL
======================================================================

Preserve existing.

======================================================================
PART 404 â€” USER EXPLICIT UI REQUIREMENT
======================================================================

Existing public UI should remain the same unless required for these
features.

Do not trigger broad redesign.

======================================================================
PART 405 â€” UI REGRESSION TEST
======================================================================

Compare public pages before/after.

No broken:
spacing
font
buttons
header
products
animations.

======================================================================
PART 406 â€” EXISTING BUTTONS
======================================================================

Keep working.

======================================================================
PART 407 â€” CUSTOMER ACCESS BUTTON
======================================================================

Now opens platform selection.

======================================================================
PART 408 â€” EXISTING CUSTOMER DATABASE
======================================================================

Do not reset.

======================================================================
PART 409 â€” EXISTING PASSWORD HASH
======================================================================

Preserve compatible hashing.

If migration needed:
do it safely.

======================================================================
PART 410 â€” EXISTING CUSTOMER DEVICE
======================================================================

Preserve.

======================================================================
PART 411 â€” EXISTING ANDROID USERS
======================================================================

Should continue logging in under Android.

======================================================================
PART 412 â€” OLD DIRECT CUSTOMER ACCESS
======================================================================

If old credentials try current access:

select Android.

Should work.

======================================================================
PART 413 â€” DATABASE SCHEMA OVERVIEW
======================================================================

Expected conceptual tables:

customers

customer_devices

packages

package_resources

agents

agent_access_tokens / sessions

customer_creation_proofs

products

orders

payment_methods

site_settings

management_audit_logs

session tables if used

======================================================================
PART 414 â€” CUSTOMER TABLE ADDITIONS
======================================================================

customers:

id

customer_identifier

password_hash

platform_type

package_id

status

created_source

created_by_agent_id

created_at

updated_at

last_login_at

======================================================================
PART 415 â€” AGENT STATUS
======================================================================

ACTIVE

DISABLED

======================================================================
PART 416 â€” CUSTOMER STATUS
======================================================================

ACTIVE

DISABLED

EXPIRED

======================================================================
PART 417 â€” RESOURCE STATUS
======================================================================

AVAILABLE

UPDATING

UNAVAILABLE

======================================================================
PART 418 â€” PACKAGE ACTIVE
======================================================================

Boolean/status.

======================================================================
PART 419 â€” DEFAULT PACKAGE CONFIG
======================================================================

site settings or platform configuration table.

======================================================================
PART 420 â€” PLATFORM SETTINGS TABLE OPTIONAL
======================================================================

platform_settings

platform_type

default_package_id

active

customer_label

updated_at

Could simplify default package configuration.

======================================================================
PART 421 â€” DISABLE PLATFORM OPTIONAL
======================================================================

Owner may later disable one platform.

If implemented:

platform selection hides/marks unavailable.

Not essential unless easy.

======================================================================
PART 422 â€” PLATFORM CUSTOMER COUNT
======================================================================

Admin overview.

======================================================================
PART 423 â€” AGENT PLATFORM COUNT
======================================================================

Admin per-agent metrics.

======================================================================
PART 424 â€” AUDIT SOURCE
======================================================================

All admin/agent mutation events include actor.

======================================================================
PART 425 â€” OWNER ACTOR
======================================================================

OWNER_ADMIN.

======================================================================
PART 426 â€” AGENT ACTOR
======================================================================

AGENT + agent ID.

======================================================================
PART 427 â€” CUSTOMER ACTIONS
======================================================================

Separate logs if existing.

======================================================================
PART 428 â€” PUBLIC SECURITY
======================================================================

Do not expose agent names to public.

======================================================================
PART 429 â€” PUBLIC CUSTOMER CREATION SOURCE
======================================================================

Do not show.

======================================================================
PART 430 â€” CUSTOMER DASHBOARD DOES NOT SHOW AGENT
======================================================================

No need.

======================================================================
PART 431 â€” CUSTOMER DASHBOARD DOES NOT SHOW RECEIPT
======================================================================

No.

======================================================================
PART 432 â€” CUSTOMER ONLY NEEDS RESOURCES
======================================================================

Yes.

======================================================================
PART 433 â€” AGENT DOES NOT SEE ADMIN STATS
======================================================================

No.

======================================================================
PART 434 â€” AGENT DOES NOT SEE STORE ORDERS
======================================================================

No.

======================================================================
PART 435 â€” AGENT DOES NOT SEE PRODUCT PRICES
======================================================================

Not necessary.

======================================================================
PART 436 â€” AGENT DOES NOT SEE RESOURCE SECRETS
======================================================================

Critical.

======================================================================
PART 437 â€” AGENT CREATION PACKAGE INTERNAL
======================================================================

Hidden.

======================================================================
PART 438 â€” AGENT CREATION SUCCESS ACCESS DETAILS
======================================================================

Only:
platform
ID
password
access URL.

======================================================================
PART 439 â€” AGENT RECEIPT AUDIT
======================================================================

Receipt linked but not part of copied customer details.

======================================================================
PART 440 â€” CUSTOMER COPY MESSAGE
======================================================================

Clean WhatsApp-friendly formatting.

======================================================================
PART 441 â€” COPY EXAMPLE
======================================================================

MK Panel Zone Access

Platform: Android
Customer ID: USER123
Password: ******

Customer Access:
https://example.com/access

Keep copied text concise.

======================================================================
PART 442 â€” NO PASSWORD MASK IN COPIED MESSAGE
======================================================================

Use entered plaintext currently held in success state.

======================================================================
PART 443 â€” SUCCESS STATE SECURITY
======================================================================

If page is refreshed after creation:

do not re-fetch plaintext password.

Success password disappears.

This is expected.

======================================================================
PART 444 â€” AGENT WARNING BEFORE LEAVING SUCCESS
======================================================================

Optional small note:

Copy the customer access details now. The password cannot be viewed
again later.

This is useful.

======================================================================
PART 445 â€” AGENT PASSWORD COPY
======================================================================

Separate COPY PASSWORD optional.

======================================================================
PART 446 â€” COPY ALL
======================================================================

Main action.

======================================================================
PART 447 â€” ADMIN CUSTOMER PASSWORD
======================================================================

Owner also cannot view old password.

Can reset.

======================================================================
PART 448 â€” PAYMENT RECEIPT PREVIEW SECURITY
======================================================================

Use local object URL before upload.

Revoke when done.

======================================================================
PART 449 â€” MEMORY CLEANUP
======================================================================

Clear password state after leaving success/create another.

======================================================================
PART 450 â€” NO PASSWORD IN URL
======================================================================

Never.

======================================================================
PART 451 â€” NO PASSWORD IN LOG
======================================================================

Never.

======================================================================
PART 452 â€” NO PASSWORD IN ANALYTICS
======================================================================

Never.

======================================================================
PART 453 â€” NO RECEIPT IN ANALYTICS
======================================================================

Never.

======================================================================
PART 454 â€” MANAGEMENT ANALYTICS
======================================================================

Not required.

======================================================================
PART 455 â€” AGENT CREATION CONFIRMATION
======================================================================

Do not require extra confirmation modal every time.

Agents need speed.

======================================================================
PART 456 â€” DUPLICATE ID CONFIRMATION
======================================================================

No. Just error.

======================================================================
PART 457 â€” PLATFORM SWITCH AFTER ENTERING FORM
======================================================================

If customer ID/password entered then platform switched:

clear receipt? For agent form:
keep receipt optional.

Prefer warn only if necessary.

Simple:
keep ID/password/receipt while switching before create.

Server creates selected platform.

======================================================================
PART 458 â€” AGENT ERROR RETAINS FORM
======================================================================

If server error:

do not clear fields/receipt unnecessarily.

======================================================================
PART 459 â€” AGENT SUCCESS CLEARS AFTER COPY/NEW
======================================================================

Yes.

======================================================================
PART 460 â€” CUSTOMER ACCESS WRONG PLATFORM RETAINS ID
======================================================================

Yes where safe.

======================================================================
PART 461 â€” CUSTOMER INVALID PASSWORD
======================================================================

Clear password field or focus it.

======================================================================
PART 462 â€” CUSTOMER PLATFORM CARDS ACCESSIBILITY
======================================================================

Keyboard accessible.

======================================================================
PART 463 â€” AGENT PLATFORM CARDS ACCESSIBILITY
======================================================================

Keyboard/touch.

======================================================================
PART 464 â€” ADMIN ACCESSIBILITY
======================================================================

Basic strong accessibility.

======================================================================
PART 465 â€” REDUCED MOTION
======================================================================

Respect globally.

======================================================================
PART 466 â€” AGENT PANEL REDUCED MOTION
======================================================================

Minimal anyway.

======================================================================
PART 467 â€” ADMIN REDUCED MOTION
======================================================================

No problem.

======================================================================
PART 468 â€” RESPONSIVE PUBLIC SITE
======================================================================

Preserve.

======================================================================
PART 469 â€” RESPONSIVE PLATFORM SELECTION
======================================================================

Test thoroughly.

======================================================================
PART 470 â€” RESPONSIVE DASHBOARDS
======================================================================

Android/iPhone/PC.

======================================================================
PART 471 â€” RESPONSIVE AGENT PANEL
======================================================================

Priority.

======================================================================
PART 472 â€” RESPONSIVE OWNER PANEL
======================================================================

Good.

======================================================================
PART 473 â€” PAGE LOADING AGENT
======================================================================

Skeleton only if needed.

======================================================================
PART 474 â€” ADMIN DATA TABLE LOADING
======================================================================

Skeleton rows.

======================================================================
PART 475 â€” CUSTOMER DASHBOARD LOADING
======================================================================

Preserve current style.

======================================================================
PART 476 â€” CUSTOMER RESOURCE SECRET LOADING
======================================================================

Do not flash secret.

======================================================================
PART 477 â€” ADMIN SAVE BUTTON
======================================================================

SAVING...

Saved.

======================================================================
PART 478 â€” AGENT CREATE
======================================================================

CREATING...

======================================================================
PART 479 â€” PUBLIC LOGIN
======================================================================

VERIFYING ACCESS...

======================================================================
PART 480 â€” DOWNLOAD
======================================================================

PREPARING...

======================================================================
PART 481 â€” TOAST COPY
======================================================================

Copied.

======================================================================
PART 482 â€” RECEIPT UPLOAD
======================================================================

UPLOADING...

if separate upload.

======================================================================
PART 483 â€” NO BROWSER ALERT()
======================================================================

Use proper UI.

======================================================================
PART 484 â€” NO CONFIRM()
======================================================================

Admin dangerous actions use modal.

======================================================================
PART 485 â€” ADMIN DANGEROUS ACTIONS
======================================================================

Disable Customer

Reset Device

Disable Agent

Revoke Agent Access

Delete/Archive Product

Require confirmation.

======================================================================
PART 486 â€” AGENT ACTIONS
======================================================================

No destructive actions.

======================================================================
PART 487 â€” CUSTOMER ACTIONS
======================================================================

Logout only.

======================================================================
PART 488 â€” DATA ARCHIVE
======================================================================

Prefer soft disable over permanent deletion.

======================================================================
PART 489 â€” CUSTOMERS
======================================================================

Do not permanently delete by default.

======================================================================
PART 490 â€” AGENTS
======================================================================

Disable rather than delete.

======================================================================
PART 491 â€” PRODUCTS
======================================================================

Archive/disable.

======================================================================
PART 492 â€” AUDIT PROOFS
======================================================================

Preserve unless owner retention policy later removes.

======================================================================
PART 493 â€” DATABASE INDEXES
======================================================================

Add useful indexes:

customers.customer_identifier

customers.platform_type

customers.created_by_agent_id

customers.status

packages.platform_type

agents.status

creation_proofs.customer_id

orders.status

products.slug

======================================================================
PART 494 â€” UNIQUE CONSTRAINT
======================================================================

customers.customer_identifier unique.

======================================================================
PART 495 â€” FOREIGN KEYS
======================================================================

customers.package_id â†’ packages.id

customers.created_by_agent_id â†’ agents.id

customer_creation_proofs.customer_id â†’ customers.id

customer_creation_proofs.agent_id â†’ agents.id

======================================================================
PART 496 â€” SAFE DELETE BEHAVIOR
======================================================================

Do not cascade-delete historical proof unexpectedly.

======================================================================
PART 497 â€” ADMIN AUDIT INDEX
======================================================================

timestamp / actor.

======================================================================
PART 498 â€” TIME
======================================================================

Use timezone-aware DB timestamps.

======================================================================
PART 499 â€” DATE DISPLAY
======================================================================

Readable.

Example:

20 Sep 2026, 10:32 PM

Locale appropriate.

======================================================================
PART 500 â€” FINAL INTEGRATION PRIORITIES
======================================================================

Priority order:

1. BACK UP / UNDERSTAND EXISTING DATABASE

2. ADD PLATFORM DATA MODEL

3. MIGRATE EXISTING CUSTOMERS TO ANDROID SAFELY

4. ADD PLATFORM SELECTION TO CUSTOMER ACCESS

5. ENFORCE PLATFORM LOGIN SERVER-SIDE

6. BUILD ANDROID/IPHONE/PC DASHBOARD RESOURCE VARIANTS

7. VERIFY DEVICE BINDING STILL WORKS

8. BUILD SECURE OWNER AUTHORIZATION WITHOUT PUBLIC LOGIN PAGE

9. BUILD OWNER ADMIN PANEL

10. BUILD AGENT MODEL + SECURE INVITES

11. BUILD LIMITED AGENT PANEL

12. ADD RECEIPT UPLOAD

13. BUILD AGENT CUSTOMER CREATION

14. LINK AGENT CUSTOMER TO PLATFORM DEFAULT PACKAGE

15. VERIFY WRONG-PLATFORM WARNING

16. VERIFY PUBLIC STORE REGRESSION

17. VERIFY MOBILE

18. VERIFY SECURITY

19. RUN PRODUCTION BUILD

20. FINAL POLISH

======================================================================
MANDATORY TEST CASES
======================================================================

TEST 1:

Existing Android customer.

Open Customer Access.

Select Android.

Enter correct credentials.

Expected:

successful login.

Correct Android dashboard.

Existing resources available.

======================================================================
TEST 2:

Same Android customer.

Select iPhone.

Enter correct credentials.

Expected:

NO LOGIN.

Message:

WRONG PLATFORM.

This access belongs to Android.

Button:

GO TO ANDROID ACCESS.

======================================================================
TEST 3:

Android customer.

Select PC.

Expected:

Wrong Platform.

======================================================================
TEST 4:

iPhone customer.

Select iPhone.

Correct credentials.

Expected:

iPhone dashboard.

Only:

iPhone File

iPhone Tutorial.

======================================================================
TEST 5:

iPhone customer chooses Android.

Expected:

Wrong Platform.

No device registration occurs.

======================================================================
TEST 6:

PC customer.

Select PC.

Expected:

PC dashboard.

PC File.

File Password.

======================================================================
TEST 7:

PC customer selects iPhone.

Expected:

Wrong Platform.

======================================================================
TEST 8:

Invalid ID/password.

Expected:

Invalid customer ID or password.

Do not reveal platform.

======================================================================
TEST 9:

Correct platform and correct credentials on first device.

Expected:

first device registered.

======================================================================
TEST 10:

Same customer on another device.

Expected:

device mismatch/registered message according to existing policy.

======================================================================
TEST 11:

Agent opens valid private invite.

Expected:

server validates token.

sets agent session.

redirects clean /agent-panel.

No login screen.

Secret token disappears from URL.

======================================================================
TEST 12:

Disabled agent opens panel.

Expected:

access unavailable.

Cannot create customer.

======================================================================
TEST 13:

Agent selects Android.

Inputs:

Customer ID

Password

Receipt.

Click CREATE CUSTOMER.

Expected:

Android customer created.

Default Android package assigned.

Payment receipt private.

Creation source = agent.

Correct agent ID stored.

======================================================================
TEST 14:

Agent copies access details.

Expected:

correct:
platform
customer ID
password
access URL.

======================================================================
TEST 15:

Agent-created Android customer logs in Android.

Expected:

works.

======================================================================
TEST 16:

Same agent-created Android customer logs in iPhone.

Expected:

wrong platform.

======================================================================
TEST 17:

Agent creates iPhone.

Expected:

customer gets iPhone package.

Dashboard has only file/tutorial.

======================================================================
TEST 18:

Agent creates PC.

Expected:

PC package.

Dashboard file + password.

======================================================================
TEST 19:

Agent attempts duplicate ID.

Expected:

safe duplicate error.

No duplicate record.

No orphan receipt.

======================================================================
TEST 20:

Agent submits invalid image.

Expected:

rejected.

======================================================================
TEST 21:

Agent double-clicks create.

Expected:

one customer only.

======================================================================
TEST 22:

Owner admin opens via valid private owner access.

Expected:

secure session.

admin panel.

No public login page.

======================================================================
TEST 23:

Unauthorized user directly enters admin route.

Expected:

no admin UI.

No data leak.

======================================================================
TEST 24:

Unauthorized user directly enters agent panel route.

Expected:

no agent UI.

======================================================================
TEST 25:

Owner sees agent-created customer.

Expected:

agent name

platform

receipt

customer status.

======================================================================
TEST 26:

Owner disables agent.

Expected:

agent cannot create more customers.

======================================================================
TEST 27:

Owner changes Android main file.

Expected:

Android customers see updated resource.

iPhone and PC unaffected.

======================================================================
TEST 28:

Owner changes iPhone file.

Expected:

iPhone customers only.

======================================================================
TEST 29:

Owner changes PC password.

Expected:

PC customers only.

======================================================================
TEST 30:

Public homepage.

Expected:

appearance unchanged except intended new access integration.

======================================================================
TEST 31:

Products.

Expected:

unchanged functionality.

======================================================================
TEST 32:

Checkout.

Expected:

unchanged functionality.

======================================================================
TEST 33:

Mobile Customer Access.

Expected:

Android/iPhone/PC selection works.

======================================================================
TEST 34:

Mobile agent panel.

Expected:

fast and usable.

======================================================================
TEST 35:

Production build.

Expected:

zero critical errors.

======================================================================
FINAL SECURITY REVIEW
======================================================================

Before completion verify:

No admin route linked publicly.

No agent route linked publicly.

No raw owner secret in client.

No raw agent access token stored in DB.

No customer authentication password plaintext stored.

No private receipt publicly accessible.

No platform authorization client-only.

No customer can request another platform's resources.

No agent can perform owner/admin action.

No customer can perform agent action.

No service-role key in client bundle.

No password in URL.

No session token in URL after bootstrap.

No receipt URL exposed publicly.

======================================================================
FINAL PUBLIC UI RULE
======================================================================

THE EXISTING WEBSITE UI SHOULD STAY CONSISTENT.

Do NOT take this specification as permission to redesign the existing
public store again.

Only integrate:

- platform selection
- platform-specific access
- platform dashboards
- necessary warning/error states

using the existing theme/components.

======================================================================
FINAL AGENT UI RULE
======================================================================

AGENT PANEL MUST FEEL:

professional
fast
clean
modern
dark
premium

but NOT:

over-animated
cinematic
slow
busy
marketing-heavy.

Use:

deep navy
dark crimson
near-black
glass
subtle glow
quick micro-interactions.

The agent should be able to create access very quickly.

======================================================================
FINAL OWNER ADMIN RULE
======================================================================

ADMIN PANEL IS OWNER-ONLY.

It should be the central control room for MK Panel Zone.

Almost every business-controlled website detail should be editable
through structured settings.

The owner has full access.

Agents do not.

Customers do not.

======================================================================
FINAL ROLE DEFINITION
======================================================================

CUSTOMER:

Selects Android/iPhone/PC.

Logs in with ID/password.

Can only use their own platform.

Uses assigned digital resources.

No management capability.

--------------------------------------------------

AGENT:

Private access.

No visible public login screen.

Chooses Android/iPhone/PC.

Enters customer ID.

Enters password.

Uploads payment receipt.

Clicks Create Customer.

Copies credentials.

Can only create customers.

Cannot control website.

--------------------------------------------------

OWNER ADMIN:

Private owner access.

No public login screen.

Full website management.

Full customer management.

Full agent management.

Full resource management.

Full platform management.

Full product/settings management.

======================================================================
ABSOLUTE DO-NOT-BREAK RULE
======================================================================

Do NOT mark implementation finished until:

existing public website still works

Android access works

iPhone access works

PC access works

platform mismatch is enforced

device lock still works

Android resources work

iPhone file/tutorial work

PC file/password work

admin access is secure

agent access is secure

agent can create customer

agent receipt upload works

correct platform package is assigned

agent-created customer can immediately log in

wrong platform login fails correctly

owner sees who created customer

owner sees receipt

mobile agent panel works

no public UI regression exists

production build succeeds.

======================================================================
END OF MK PANEL ZONE
PLATFORM ACCESS + ADMIN + AGENT PANEL MASTER SPECIFICATION
======================================================================
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-20T22:42:37+05:00.

The user's current state is as follows:
Other open documents:
- c:\Users\Khani-RTX\.gemini\antigravity-ide\scratch\mk-panel-zone\src\components\home\ProductsSection.tsx (LANGUAGE_TSX)
- c:\Users\Khani-RTX\.gemini\antigravity-ide\scratch\mk-panel-zone\prisma\schema.prisma (LANGUAGE_UNSPECIFIED)
- c:\Users\Khani-RTX\.gemini\antigravity-ide\scratch\mk-panel-zone\src\components\ui\Steps.tsx (LANGUAGE_TSX)
- c:\Users\Khani-RTX\.gemini\antigravity-ide\scratch\mk-panel-zone\src\app\page.tsx (LANGUAGE_TSX)
- c:\Users\Khani-RTX\.gemini\antigravity-ide\scratch\mk-panel-zone\src\components\ui\Input.tsx (LANGUAGE_TSX)
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.1 Pro (High). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>
