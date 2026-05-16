-- ─── Task Guides table: trade-specific step-by-step guides ──────────────────

create table if not exists public.task_guides (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  description     text not null,
  trade           text not null check (trade in ('plumbing', 'electrical', 'hvac', 'carpentry', 'concrete', 'general')),
  category        text not null,  -- e.g. 'Install', 'Rough-In', 'Repair', 'Maintenance', 'Emergency', 'Code'
  difficulty      text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes int not null default 30,
  step_count      int not null default 5,
  is_premium      boolean not null default false,
  steps           jsonb,          -- [{step: 1, title: '...', description: '...', tip: '...'}]
  tools_required  text[],
  materials       text[],
  code_reference  text,           -- e.g. 'NEC 210.8', 'IPC 712.3'
  created_at      timestamptz default now()
);

-- Public read access — all authenticated users can read guides
alter table public.task_guides enable row level security;

create policy "All authenticated users can read guides"
  on public.task_guides for select
  to authenticated
  using (true);

create index task_guides_trade_idx on public.task_guides(trade);
create index task_guides_category_idx on public.task_guides(category);

-- ─── Guide Bookmarks ─────────────────────────────────────────────────────────

create table if not exists public.guide_bookmarks (
  user_id  uuid references auth.users(id) on delete cascade,
  guide_id uuid references public.task_guides(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, guide_id)
);

alter table public.guide_bookmarks enable row level security;

create policy "Users manage own guide bookmarks"
  on public.guide_bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Seed: Existing Plumbing & General guides ────────────────────────────────

insert into public.task_guides (title, description, trade, category, difficulty, estimated_minutes, step_count, is_premium, code_reference) values
('Install PVC P-Trap', 'Step-by-step guide for installing a standard 1-1/2" PVC P-trap under a sink.', 'plumbing', 'Install', 'beginner', 25, 8, false, 'IPC 1002'),
('Rough-In Drain Stack', 'Complete rough-in installation for a 3" drain stack with venting.', 'plumbing', 'Rough-In', 'advanced', 90, 18, true, 'IPC 912'),
('Supply Line Installation', 'Install flexible braided supply lines for sink faucets and toilets.', 'plumbing', 'Rough-In', 'beginner', 20, 7, false, 'IPC 604'),
('Emergency Pipe Repair', 'Quick repair procedures for burst or leaking pipes.', 'plumbing', 'Emergency', 'intermediate', 30, 9, false, 'IPC 101'),
('Install Pressure Relief Valve', 'Install a T&P relief valve on a water heater.', 'plumbing', 'Install', 'intermediate', 35, 10, false, 'IPC 504.6');

-- ─── Seed: 50 Electrical guides ──────────────────────────────────────────────

insert into public.task_guides (title, description, trade, category, difficulty, estimated_minutes, step_count, is_premium, code_reference) values
-- Install
('GFCI Outlet Replacement', 'Replace a standard outlet with a GFCI outlet for bathroom or kitchen use.', 'electrical', 'Install', 'intermediate', 35, 12, false, 'NEC 210.8'),
('Install a 20-Amp Outlet', 'Install a dedicated 20-amp receptacle for kitchen appliances.', 'electrical', 'Install', 'intermediate', 40, 10, false, 'NEC 210.11'),
('Add a New Light Switch', 'Run wire and install a single-pole light switch from an existing circuit.', 'electrical', 'Install', 'intermediate', 45, 12, false, 'NEC 404.14'),
('Install Ceiling Fan Wiring', 'Wire and mount a ceiling fan with light kit in an existing junction box.', 'electrical', 'Install', 'intermediate', 60, 15, false, 'NEC 210.6'),
('Install AFCI Breaker', 'Replace a standard breaker with an arc-fault circuit interrupter breaker.', 'electrical', 'Install', 'advanced', 30, 10, false, 'NEC 210.12'),
('Install USB Outlet', 'Replace a standard outlet with a USB-A/C combo outlet.', 'electrical', 'Install', 'beginner', 20, 7, false, 'NEC 406.1'),
('Install Under-Cabinet Lighting', 'Install hardwired under-cabinet LED lighting strip.', 'electrical', 'Install', 'intermediate', 50, 12, false, 'NEC 410.6'),
('Add Outdoor GFCI Outlet', 'Install a weatherproof outdoor receptacle with GFCI protection.', 'electrical', 'Install', 'intermediate', 55, 14, false, 'NEC 210.8'),
('Install a 240V Dryer Outlet', 'Run a 10/3 circuit and install a NEMA 14-30 dryer receptacle.', 'electrical', 'Install', 'advanced', 90, 18, true, 'NEC 210.19'),
('Install Dimmer Switch', 'Replace a standard switch with an LED-compatible dimmer.', 'electrical', 'Install', 'beginner', 25, 8, false, 'NEC 404.14'),
-- Rough-In
('Breaker Panel Inspection', 'Complete safety inspection checklist for residential breaker panels.', 'electrical', 'Maintenance', 'advanced', 60, 15, true, 'NEC 230.70'),
('Rough-In Electrical for Kitchen', 'Run circuits for kitchen island, refrigerator, and countertop receptacles.', 'electrical', 'Rough-In', 'advanced', 120, 20, true, 'NEC 210.52'),
('Rough-In Bathroom Circuits', 'Install dedicated 20A bathroom circuit with GFCI protection.', 'electrical', 'Rough-In', 'advanced', 80, 16, true, 'NEC 210.11'),
('Install Electrical Panel', 'Mount and wire a new main service panel (200A).', 'electrical', 'Rough-In', 'advanced', 240, 25, true, 'NEC 230.79'),
('Wire Recessed Lighting Circuit', 'Install IC-rated recessed lights on a new 15A circuit.', 'electrical', 'Rough-In', 'intermediate', 90, 18, false, 'NEC 410.116'),
('Install Junction Box', 'Mount and wire a metal junction box for circuit extension.', 'electrical', 'Rough-In', 'beginner', 30, 9, false, 'NEC 314.16'),
('Run EMT Conduit', 'Measure, cut, and bend EMT conduit for surface wiring run.', 'electrical', 'Rough-In', 'intermediate', 60, 14, false, 'NEC 358.24'),
('Wire 3-Way Switch', 'Install travelers and wire a 3-way switch circuit.', 'electrical', 'Rough-In', 'intermediate', 50, 13, false, 'NEC 404.2'),
('Install Subpanel', 'Install and wire a 60A subpanel fed from main panel.', 'electrical', 'Rough-In', 'advanced', 180, 22, true, 'NEC 225.36'),
('Low Voltage Wiring Rough-In', 'Rough-in Cat6 ethernet and coax cable alongside electrical.', 'electrical', 'Rough-In', 'beginner', 60, 12, false, 'NEC 800.133'),
-- Repair
('Replace Faulty Outlet', 'Diagnose and replace a dead or sparking electrical outlet.', 'electrical', 'Repair', 'intermediate', 30, 10, false, 'NEC 406.6'),
('Fix Tripping Breaker', 'Identify cause of nuisance breaker trips and resolve.', 'electrical', 'Repair', 'advanced', 45, 12, false, 'NEC 240.4'),
('Repair Aluminum Wiring Connection', 'Add CO/ALR devices or pigtail copper to aluminum wiring.', 'electrical', 'Repair', 'advanced', 60, 14, true, 'NEC 406.9'),
('Replace Pull Chain Light Socket', 'Swap out a faulty pull chain socket in a fixture.', 'electrical', 'Repair', 'beginner', 20, 7, false, 'NEC 410'),
('Repair Outdoor Light Fixture', 'Replace a weathered outdoor fixture and restore weatherproofing.', 'electrical', 'Repair', 'beginner', 35, 9, false, 'NEC 410.53'),
('Fix Backstabbed Outlets', 'Remove backstab wiring and convert to screw terminal connections.', 'electrical', 'Repair', 'intermediate', 25, 8, false, 'NEC 406.5'),
('Repair Knob and Tube Splice', 'Safely splice into existing knob-and-tube wiring for an extension.', 'electrical', 'Repair', 'advanced', 60, 15, true, 'NEC 394'),
('Replace Old Two-Prong Outlet', 'Upgrade ungrounded outlet to GFCI-protected replacement.', 'electrical', 'Repair', 'intermediate', 30, 10, false, 'NEC 406.4'),
('Fix Overloaded Circuit', 'Identify loads and redistribute or add a circuit.', 'electrical', 'Repair', 'advanced', 90, 16, true, 'NEC 210.23'),
('Replace Hot/Neutral Reversed Outlet', 'Identify and correct a reversed polarity outlet.', 'electrical', 'Repair', 'beginner', 20, 8, false, 'NEC 200.11'),
-- Maintenance
('Panel Torque Check', 'Torque all panel bus bar lugs and breakers to spec.', 'electrical', 'Maintenance', 'advanced', 60, 12, true, 'NEC 110.14'),
('Thermal Imaging Inspection', 'Use thermal camera to identify hot spots in panel.', 'electrical', 'Maintenance', 'advanced', 45, 10, true, 'NFPA 70B'),
('Test All GFCI Outlets', 'Monthly GFCI test procedure for all protected receptacles.', 'electrical', 'Maintenance', 'beginner', 30, 8, false, 'NEC 210.8'),
('Label Panel Circuits', 'Create and apply a complete, accurate panel directory.', 'electrical', 'Maintenance', 'beginner', 45, 10, false, 'NEC 408.4'),
('Smoke Detector Wiring Check', 'Inspect hardwired interconnected smoke detector circuit.', 'electrical', 'Maintenance', 'intermediate', 40, 11, false, 'NFPA 72'),
-- Emergency
('Restore Power After Trip', 'Safely identify cause and reset a tripped main breaker.', 'electrical', 'Emergency', 'intermediate', 20, 8, false, 'NEC 230.71'),
('Isolate a Sparking Outlet', 'Immediately isolate and safely de-energize a sparking receptacle.', 'electrical', 'Emergency', 'beginner', 10, 5, false, 'NEC 110.9'),
('Water in Panel Response', 'Emergency procedure when water enters electrical panel.', 'electrical', 'Emergency', 'advanced', 30, 10, true, 'NEC 230.54'),
('Generator Interlock Installation', 'Install a breaker interlock for safe generator hookup.', 'electrical', 'Emergency', 'advanced', 90, 18, true, 'NEC 702.5'),
('Restore Power After Flood', 'Safe sequence for restoring electrical after flood event.', 'electrical', 'Emergency', 'advanced', 120, 20, true, 'NEC 110.3'),
-- Code
('Box Fill Calculation', 'Calculate and document NEC box fill for proper sizing.', 'electrical', 'Code', 'advanced', 30, 10, false, 'NEC 314.16'),
('Voltage Drop Calculation', 'Calculate wire size to keep voltage drop under 3%.', 'electrical', 'Code', 'intermediate', 25, 8, false, 'NEC 310.15'),
('Circuit Load Calculation', 'Calculate total load for a branch circuit or panel.', 'electrical', 'Code', 'advanced', 45, 12, false, 'NEC 220.12'),
('Ground Fault vs Arc Fault Requirements', 'Map which circuits require GFCI vs AFCI protection.', 'electrical', 'Code', 'intermediate', 35, 10, false, 'NEC 210.8/210.12'),
('Conductor Ampacity Table', 'Use NEC Table 310.15 to select proper wire gauge.', 'electrical', 'Code', 'intermediate', 20, 8, false, 'NEC 310.15'),
('Service Entrance Requirements', 'Review clearances, grounding, and sizing for service entrance.', 'electrical', 'Code', 'advanced', 50, 14, true, 'NEC 230'),
('Grounding Electrode System', 'Install and bond a grounding electrode system to code.', 'electrical', 'Code', 'advanced', 60, 15, true, 'NEC 250.50'),
('Bonding Requirements for Pools', 'Ensure all metallic pool components are equipotentially bonded.', 'electrical', 'Code', 'advanced', 90, 16, true, 'NEC 680.26'),
('Install EV Charging Circuit', 'Run 40A/50A dedicated circuit for Level 2 EV charger.', 'electrical', 'Install', 'advanced', 120, 18, true, 'NEC 625'),
('LED Retrofit Dimming Fix', 'Resolve LED flickering/pop-off on dimmer circuits.', 'electrical', 'Repair', 'intermediate', 30, 10, false, 'NEC 404.14');

-- ─── Seed: 40 HVAC guides ────────────────────────────────────────────────────

insert into public.task_guides (title, description, trade, category, difficulty, estimated_minutes, step_count, is_premium, code_reference) values
-- Install
('Thermostat Wiring', 'Wire a new programmable or smart thermostat to an HVAC system.', 'hvac', 'Install', 'beginner', 25, 8, false, 'ASHRAE 90.1'),
('HVAC Ductwork Tie-In', 'Connect new branch ductwork to an existing trunk line.', 'hvac', 'Install', 'intermediate', 45, 10, false, 'ACCA Manual D'),
('Install Mini-Split Line Set', 'Run refrigerant line set for a ductless mini-split system.', 'hvac', 'Install', 'advanced', 120, 18, true, 'ASHRAE 15'),
('Install Condensate Pump', 'Install a mini-condensate pump on a high-wall unit.', 'hvac', 'Install', 'intermediate', 40, 10, false, 'IMC 307.2'),
('Install Duct Takeoff', 'Cut and install a round takeoff into a sheet metal trunk duct.', 'hvac', 'Install', 'intermediate', 35, 9, false, 'SMACNA'),
('Air Handler Installation', 'Mount and connect an indoor air handler in an attic.', 'hvac', 'Install', 'advanced', 180, 22, true, 'IMC 304'),
('Install Condensate Drain Pan', 'Install and pipe a secondary condensate drain pan.', 'hvac', 'Install', 'intermediate', 50, 12, false, 'IMC 307.2.3'),
('Install ERV/HRV', 'Install an energy recovery ventilator for fresh air.', 'hvac', 'Install', 'advanced', 150, 20, true, 'ASHRAE 62.2'),
('Install UV Air Purifier', 'Mount UV germicidal lamp inside air handler cabinet.', 'hvac', 'Install', 'intermediate', 40, 10, false, 'ASHRAE 62.1'),
('Gas Furnace Installation', 'Complete installation of a 96% AFUE gas furnace.', 'hvac', 'Install', 'advanced', 240, 28, true, 'NFPA 54'),
-- Rough-In
('Rough-In Supply Plenum', 'Fabricate and hang a sheet metal supply plenum.', 'hvac', 'Rough-In', 'advanced', 90, 16, true, 'SMACNA'),
('Flexible Duct Rough-In', 'Route and hang flexible duct from plenum to registers.', 'hvac', 'Rough-In', 'intermediate', 60, 12, false, 'ACCA Manual D'),
('Refrigerant Line Rough-In', 'Route and insulate refrigerant lines through framing.', 'hvac', 'Rough-In', 'advanced', 90, 16, true, 'ASHRAE 15'),
('Gas Line Rough-In', 'Run CSST or black iron gas line to furnace location.', 'hvac', 'Rough-In', 'advanced', 120, 18, true, 'NFPA 54'),
('Return Air Rough-In', 'Cut and frame a central return air plenum opening.', 'hvac', 'Rough-In', 'intermediate', 60, 14, false, 'ACCA Manual D'),
('Condenser Pad Placement', 'Set a concrete pad and position outdoor condensing unit.', 'hvac', 'Rough-In', 'beginner', 60, 10, false, 'IMC 904.1'),
('Attic Air Sealing for HVAC', 'Air seal penetrations and duct boots in unconditioned attic.', 'hvac', 'Rough-In', 'intermediate', 90, 14, false, 'ASHRAE 62.2'),
-- Repair
('Check and Recharge Refrigerant', 'Verify charge using superheat/subcooling method and add refrigerant.', 'hvac', 'Repair', 'advanced', 60, 14, true, 'EPA 608'),
('Replace TXV Valve', 'Recover refrigerant, replace thermal expansion valve, recharge.', 'hvac', 'Repair', 'advanced', 120, 18, true, 'ASHRAE 15'),
('Clean Evaporator Coil', 'Access and clean a clogged evaporator coil in place.', 'hvac', 'Repair', 'intermediate', 60, 14, false, 'ASHRAE 62.1'),
('Replace Contactor', 'Diagnose and replace a failed contactor on condenser.', 'hvac', 'Repair', 'intermediate', 30, 9, false, 'NEC 440.12'),
('Replace Capacitor', 'Discharge and replace a failed run/start capacitor.', 'hvac', 'Repair', 'intermediate', 20, 8, false, 'NEC 440'),
('Seal Duct Leakage', 'Apply Mastic sealant to accessible duct leaks and joints.', 'hvac', 'Repair', 'beginner', 45, 10, false, 'IECC C403.2.9'),
('Replace ECM Blower Motor', 'Swap out a failed variable-speed ECM blower motor.', 'hvac', 'Repair', 'advanced', 90, 16, true, 'NEC 430'),
('Unclog Condensate Drain', 'Clear algae blockage from primary condensate drain line.', 'hvac', 'Repair', 'beginner', 20, 7, false, 'IMC 307.2'),
('Repair Duct Breach', 'Locate and seal a disconnected duct section in attic.', 'hvac', 'Repair', 'intermediate', 60, 12, false, 'ACCA Manual D'),
('Replace Igniter on Furnace', 'Swap a cracked silicon carbide igniter on a gas furnace.', 'hvac', 'Repair', 'intermediate', 35, 10, false, 'NFPA 54'),
-- Maintenance
('Annual AC Tune-Up', '25-point annual air conditioner tune-up and inspection.', 'hvac', 'Maintenance', 'intermediate', 60, 25, false, 'ASHRAE 62.1'),
('Filter Change Procedure', 'Locate, size, and replace HVAC filter for optimal airflow.', 'hvac', 'Maintenance', 'beginner', 15, 5, false, 'ASHRAE 52.2'),
('Clean Condenser Coils', 'Safely clean outdoor condenser coils with coil cleaner.', 'hvac', 'Maintenance', 'beginner', 30, 8, false, 'ASHRAE 62.1'),
('Combustion Analysis on Furnace', 'Perform CO2, CO, and flue temperature combustion analysis.', 'hvac', 'Maintenance', 'advanced', 45, 12, true, 'NFPA 54'),
('Blower Wheel Cleaning', 'Remove and clean a squirrel cage blower wheel.', 'hvac', 'Maintenance', 'intermediate', 60, 14, false, 'ASHRAE 62.1'),
-- Emergency
('No Cooling Diagnosis', '5-step rapid diagnosis for a system that is not cooling.', 'hvac', 'Emergency', 'intermediate', 30, 10, false, 'ASHRAE 15'),
('Gas Smell Response', 'Emergency procedure when a gas odor is detected at HVAC.', 'hvac', 'Emergency', 'advanced', 15, 7, true, 'NFPA 54'),
('Frozen Evaporator Coil', 'Thaw and diagnose a fully iced-over evaporator coil.', 'hvac', 'Emergency', 'intermediate', 45, 12, false, 'ASHRAE 15'),
('Condensate Overflow Response', 'Stop overflow, clear blockage, and prevent future overflow.', 'hvac', 'Emergency', 'beginner', 20, 8, false, 'IMC 307.2'),
-- Code
('HVAC Load Calculation', 'Perform Manual J residential load calc for equipment sizing.', 'hvac', 'Code', 'advanced', 90, 16, true, 'ACCA Manual J'),
('Fresh Air Ventilation Code', 'Verify ASHRAE 62.2 minimum ventilation rates for dwelling.', 'hvac', 'Code', 'intermediate', 45, 12, true, 'ASHRAE 62.2'),
('Refrigerant Certification Review', 'Ensure EPA 608 compliance for refrigerant handling and records.', 'hvac', 'Code', 'advanced', 60, 14, true, 'EPA 608');
