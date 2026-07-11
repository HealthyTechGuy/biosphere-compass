-- Categories
INSERT INTO public.categories (slug, name, icon, display_order) VALUES
('food-drink','Food & Drink','utensils',1),
('accommodation','Accommodation','bed',2),
('retail','Retail','shopping-bag',3),
('energy-utilities','Energy & Utilities','zap',4),
('tourism-leisure','Tourism & Leisure','compass',5),
('professional-services','Professional Services','briefcase',6),
('agriculture','Agriculture & Fishing','wheat',7),
('construction','Construction & Trades','hammer',8),
('transport','Transport','bus',9),
('health-wellbeing','Health & Wellbeing','heart-pulse',10);

-- Compass dimensions (weights adjustable in admin)
INSERT INTO public.compass_dimensions (slug, name, description, weight, display_order) VALUES
('climate-impact','Climate Impact','Overall climate impact measurement and management, aligned with the Isle of Man Climate Impact Assessment.',1.5,1),
('energy','Energy','Energy efficiency, monitoring and reduction across operations.',1.25,2),
('carbon-reduction','Carbon Reduction','Measured carbon footprint and active reduction plans towards net zero.',1.5,3),
('waste','Waste','Waste minimisation, recycling and responsible disposal.',1.0,4),
('circular-economy','Circular Economy','Reuse, repair, and circular material flows in products and services.',1.0,5),
('water','Water','Water efficiency and protection of watercourses.',0.75,6),
('nature','Nature','Protection and enhancement of natural habitats and landscapes.',1.0,7),
('biodiversity','Biodiversity','Actions supporting native species and biodiversity net gain.',1.0,8),
('community','Community','Contribution to local community wellbeing and initiatives.',1.0,9),
('local-employment','Local Employment','Local hiring, fair pay and skills development.',0.75,10),
('education','Education','Sustainability education for staff, customers and the public.',0.5,11),
('accessibility','Accessibility','Inclusive, accessible premises, services and communications.',0.5,12),
('governance','Governance','Transparent, ethical governance and sustainability reporting.',0.75,13),
('innovation','Innovation','Innovation that advances sustainable practice.',0.5,14),
('sustainable-tourism','Sustainable Tourism','Responsible visitor experiences supporting the UNESCO Biosphere.',0.75,15);

-- Example questions (placeholders until the real Compass question set is supplied)
INSERT INTO public.compass_questions (dimension_id, prompt, help_text, max_points, display_order)
SELECT id, '[Example] Do you measure and record your performance in '||lower(name)||'?', 'Score 0 (not started) to 5 (fully embedded and independently verified). Replace with the official Biosphere Compass question set.', 5, 1 FROM public.compass_dimensions;
INSERT INTO public.compass_questions (dimension_id, prompt, help_text, max_points, display_order)
SELECT id, '[Example] Do you have a documented improvement plan with targets for '||lower(name)||'?', 'Score 0 (no plan) to 5 (targets met and publicly reported). Replace with the official Biosphere Compass question set.', 5, 2 FROM public.compass_dimensions;

-- Businesses
INSERT INTO public.businesses (slug,name,tagline,description,category_id,parish,address,latitude,longitude,website,email,phone,image_key,services,awards,certifications,renewable_energy,circular_economy,community_contribution,accessible,sustainable_tourism) VALUES
('harbour-lights-cafe','Harbour Lights Café','Farm-to-fork dining on Douglas promenade','A plant-forward café sourcing 90% of ingredients from Manx growers, running on renewable electricity and composting all food waste.',(SELECT id FROM categories WHERE slug='food-drink'),'Douglas','12 Loch Promenade, Douglas',54.1509,-4.4779,'https://harbourlights.im','hello@harbourlights.im','+44 1624 610000','cafe','{Breakfast,Lunch,"Local produce","Vegan options"}','{"Taste of Mann 2025"}','{"Food Made in Mann"}',true,true,true,true,false),
('snaefell-retreat','Snaefell Eco Retreat','Carbon-neutral hillside stays','A boutique eco guesthouse below Snaefell with air-source heating, rainwater harvesting and dark-sky stargazing decks.',(SELECT id FROM categories WHERE slug='accommodation'),'Laxey','Mountain Road, Laxey',54.2337,-4.4152,'https://snaefellretreat.im','stay@snaefellretreat.im','+44 1624 861000','hotel','{"Bed & breakfast","Guided walks","EV charging"}','{"Green Tourism Gold"}','{"Biosphere Pledge Partner"}',true,false,true,true,true),
('peel-bay-refillery','Peel Bay Refillery','Zero-waste shopping for the west','Peel''s refill store for groceries and household goods — bring your own containers and cut single-use plastic for good.',(SELECT id FROM categories WHERE slug='retail'),'Peel','5 Michael Street, Peel',54.2223,-4.6907,'https://peelrefillery.im','shop@peelrefillery.im','+44 1624 843000','shop','{"Refill groceries","Household goods","Local crafts"}','{}','{"Plastic Free Champion"}',false,true,true,true,false),
('manx-tidal-energy','Manx Tidal Energy','Powering the Island from the sea','Engineering firm developing tidal and solar installations for Manx homes and businesses, with a 100% local workforce.',(SELECT id FROM categories WHERE slug='energy-utilities'),'Ramsey','Quayside Works, Ramsey',54.3221,-4.3810,'https://manxtidal.im','info@manxtidal.im','+44 1624 812000','energy','{"Solar installation","Tidal research","Energy audits"}','{"IoM Innovation Award"}','{"ISO 14001"}',true,false,true,false,false),
('cronk-farm-dairy','Cronk Farm Organic Dairy','Regenerative farming since 1962','Family-run organic dairy practising rotational grazing, hedgerow restoration and on-farm renewable generation.',(SELECT id FROM categories WHERE slug='agriculture'),'Kirk Michael','Cronk Farm, Kirk Michael',54.2901,-4.5872,'https://cronkfarm.im','moo@cronkfarm.im','+44 1624 878000','energy','{"Organic milk","Farm shop","School visits"}','{}','{"Soil Association Organic"}',true,true,true,false,false),
('fynoderee-distillery','Fynoderee Craft Distillery','Spirits rooted in Manx nature','Small-batch distillery using foraged Manx botanicals, returnable bottles and a closed-loop cooling system.',(SELECT id FROM categories WHERE slug='food-drink'),'Ramsey','14 Parliament Street, Ramsey',54.3230,-4.3846,'https://fynoderee.example','cheers@fyn.im','+44 1624 816000','shop','{"Distillery tours",Tastings,"Returnable bottles"}','{"World Gin Silver"}','{}',false,true,true,true,true),
('sound-view-glamping','Sound View Glamping','Off-grid pods above the Calf','Solar-powered glamping pods overlooking the Calf of Man with composting facilities and wildlife-first grounds.',(SELECT id FROM categories WHERE slug='accommodation'),'Port St Mary','The Sound Road, Port St Mary',54.0680,-4.7410,'https://soundview.im','pods@soundview.im','+44 1624 833000','hotel','{"Glamping pods","Wildlife tours"}','{}','{"Green Tourism Silver"}',true,false,false,false,true),
('douglas-bike-hub','Douglas Bike Hub','Ride more, drive less','Community cycle shop offering repairs, refurbished bikes and e-bike hire to cut Island car journeys.',(SELECT id FROM categories WHERE slug='transport'),'Douglas','8 Victoria Street, Douglas',54.1520,-4.4810,'https://bikehub.im','ride@bikehub.im','+44 1624 620000','shop','{"Bike repair","E-bike hire","Refurbished bikes"}','{}','{}',false,true,true,true,true),
('ballaugh-wildflower-nursery','Ballaugh Wildflower Nursery','Growing the Island''s biodiversity','Native wildflower and tree nursery supplying rewilding projects, peat-free and powered by the sun.',(SELECT id FROM categories WHERE slug='agriculture'),'Ballaugh','Glen Road, Ballaugh',54.3105,-4.5405,'https://manxwildflowers.im','grow@manxwildflowers.im','+44 1624 897000','shop','{"Native plants","Rewilding advice","Peat-free compost"}','{"Biosphere Award 2024"}','{}',true,false,true,false,false),
('castletown-chandlery','Castletown Green Chandlery','Sustainable sailing supplies','Marine store stocking eco antifoul, repair services and a sail-recycling scheme for the south''s sailors.',(SELECT id FROM categories WHERE slug='retail'),'Castletown','The Quay, Castletown',54.0745,-4.6532,'https://greenchandlery.im','ahoy@greenchandlery.im','+44 1624 824000','shop','{"Marine supplies","Sail recycling",Repairs}','{}','{}',false,true,false,true,false),
('niarbyl-seafood-shack','Niarbyl Seafood Shack','Day-boat catch, zero air miles','Seasonal seafood shack serving only day-boat, MSC-aware catch landed at Peel, with fully compostable packaging.',(SELECT id FROM categories WHERE slug='food-drink'),'Patrick','Niarbyl Bay',54.1966,-4.7266,'https://niarbylshack.im','fish@niarbyl.im','+44 1624 845000','cafe','{"Fresh seafood",Takeaway}','{}','{}',false,false,true,false,true),
('mann-vet-eco-practice','Mann Eco Vets','Low-carbon animal care','Veterinary practice with solar power, anaesthetic gas capture and a paper-free clinic system.',(SELECT id FROM categories WHERE slug='health-wellbeing'),'Onchan','Main Road, Onchan',54.1745,-4.4530,'https://mannecovets.im','care@mannecovets.im','+44 1624 675000','energy','{"Small animal care",Surgery,"Farm visits"}','{}','{"Investors in the Environment"}',true,false,true,true,false),
('laxey-woollen-mills','Laxey Woollen Mills','Manx tweed, woven to last','Historic mill weaving Manx Loaghtan wool into tweed on restored looms, championing slow fashion and repairs.',(SELECT id FROM categories WHERE slug='retail'),'Laxey','Glen Road, Laxey',54.2301,-4.4008,'https://laxeywool.im','weave@laxeywool.im','+44 1624 861400','shop','{"Manx tweed","Mill tours","Repair service"}','{"Heritage Craft Award"}','{}',false,true,true,true,true),
('greeba-timber-frames','Greeba Timber Frames','Building with certified Manx wood','Sustainable construction firm specialising in FSC timber-frame homes with Passivhaus-level insulation.',(SELECT id FROM categories WHERE slug='construction'),'Marown','Greeba Mills, St John''s Road',54.1900,-4.5850,'https://greebatimber.im','build@greebatimber.im','+44 1624 851000','energy','{"Timber frames","Eco retrofits","Passivhaus design"}','{}','{"FSC Chain of Custody"}',false,true,false,false,false),
('port-erin-dive-school','Port Erin Dive & Snorkel','Explore the Manx marine reserves','Dive school running no-touch reef trips in Manx marine nature reserves, with citizen-science seagrass surveys.',(SELECT id FROM categories WHERE slug='tourism-leisure'),'Port Erin','Shore Road, Port Erin',54.0851,-4.7524,'https://portérindive.example','dive@pedive.im','+44 1624 835000','hotel','{"Guided dives","Snorkel safaris","Seagrass surveys"}','{}','{"Green Fins Member"}',false,false,true,false,true),
('sulby-glen-hostel','Sulby Glen Walkers'' Hostel','Rest easy, tread lightly','Budget hostel for hikers on the Millennium Way with biomass heating and a strict leave-no-trace ethos.',(SELECT id FROM categories WHERE slug='accommodation'),'Sulby','Sulby Glen Road',54.3125,-4.4930,'https://sulbyhostel.im','bunk@sulbyhostel.im','+44 1624 897600','hotel','{"Hostel beds","Packed lunches","Drying room"}','{}','{}',true,false,true,true,true),
('douglas-green-accountants','Quayle & Kermode Sustainable Accounting','Numbers with a conscience','B-Corp-inspired accountancy helping Manx firms measure carbon alongside cash, from a retrofitted net-zero office.',(SELECT id FROM categories WHERE slug='professional-services'),'Douglas','Athol Street, Douglas',54.1497,-4.4831,'https://qk.im','hello@qk.im','+44 1624 630000','energy','{"Accounting","Carbon reporting","ESG advisory"}','{}','{"Carbon Literate Organisation"}',true,false,true,true,false),
('st-johns-farmers-market','St John''s Farmers'' Market Collective','The Island''s larder, weekly','Co-operative market of 30+ Manx producers cutting food miles and packaging every Saturday at Tynwald Mills.',(SELECT id FROM categories WHERE slug='food-drink'),'German','Tynwald Mills, St John''s',54.2040,-4.6390,'https://stjohnsmarket.im','stall@stjohnsmarket.im','+44 1624 801000','shop','{"Farmers market","Veg boxes","Producer co-op"}','{}','{}',false,true,true,true,false),
('ramsey-shipyard-upcycling','Ramsey Shipyard Upcycling Co.','Old boats, new lives','Workshop turning end-of-life boats and driftwood into furniture, diverting marine waste from landfill.',(SELECT id FROM categories WHERE slug='construction'),'Ramsey','West Quay, Ramsey',54.3205,-4.3855,'https://shipyardupcycling.im','make@shipyardupcycling.im','+44 1624 815500','shop','{"Upcycled furniture",Commissions,Workshops}','{"Circular Economy Prize"}','{}',false,true,true,false,false),
('glen-maye-wellness','Glen Maye Forest Wellness','Nature-led wellbeing','Forest-bathing, yoga and cold-water coaching in Glen Maye, partnering with Manx Wildlife Trust on habitat care.',(SELECT id FROM categories WHERE slug='health-wellbeing'),'Patrick','Glen Maye',54.1830,-4.7370,'https://glenmayewellness.im','breathe@glenmaye.im','+44 1624 844000','hotel','{"Forest bathing",Yoga,"Cold-water coaching"}','{}','{}',false,false,true,false,true),
('electric-isle-taxis','Electric Isle Taxis','The all-electric fleet','The Island''s first fully electric taxi firm, charging overnight on renewable tariffs across 12 vehicles.',(SELECT id FROM categories WHERE slug='transport'),'Douglas','Lord Street, Douglas',54.1490,-4.4790,'https://electricisle.im','book@electricisle.im','+44 1624 666000','energy','{"Taxi service","Airport transfers","Accessible vehicles"}','{}','{}',true,false,false,true,false),
('bride-honey-co','Bride Honey Company','Bees for the Biosphere','Apiary of 80 hives pollinating the north''s farmland, selling raw honey in returnable jars.',(SELECT id FROM categories WHERE slug='agriculture'),'Bride','Bride Village',54.3860,-4.3880,'https://bridehoney.im','buzz@bridehoney.im','+44 1624 880000','shop','{"Raw honey","Beekeeping courses","Hive sponsorship"}','{}','{}',false,true,true,false,false),
('onchan-repair-cafe','Onchan Repair Café & Tool Library','Fix it, don''t bin it','Volunteer-powered repair café and tool library keeping appliances, clothes and bikes out of the Energy from Waste plant.',(SELECT id FROM categories WHERE slug='retail'),'Onchan','Community Hub, Onchan',54.1760,-4.4500,'https://onchanrepair.im','fix@onchanrepair.im','+44 1624 674000','shop','{Repairs,"Tool library",Workshops}','{"Community Impact Award"}','{}',false,true,true,true,false),
('mount-murray-golf-eco','Mount Murray Wild Golf','Golf, rewilded','Golf course managing 40% of its land for nature, pesticide-free greens and reservoir irrigation.',(SELECT id FROM categories WHERE slug='tourism-leisure'),'Santon','Mount Murray, Santon',54.1280,-4.5410,'https://wildgolf.im','play@wildgolf.im','+44 1624 695000','hotel','{"18-hole course","Nature trails","Club house"}','{}','{"GEO Certified"}',false,false,true,true,true);

-- Generate an assessment + per-dimension scores + weighted overall score for every seeded business
DO $$
DECLARE b RECORD; d RECORD; a_id uuid; target numeric; s numeric; total numeric; wsum numeric; st public.assessment_status; assessed date;
BEGIN
  FOR b IN SELECT id FROM public.businesses LOOP
    target := 42 + random()*54;
    st := CASE WHEN random() < 0.7 THEN 'verified'::public.assessment_status ELSE 'published'::public.assessment_status END;
    assessed := (now() - (random()*320 || ' days')::interval)::date;
    INSERT INTO public.assessments (business_id, status, submitted_at, verified_at)
    VALUES (b.id, st, assessed, CASE WHEN st='verified' THEN assessed + 14 END)
    RETURNING id INTO a_id;
    total := 0; wsum := 0;
    FOR d IN SELECT id, weight FROM public.compass_dimensions WHERE active LOOP
      s := round(GREATEST(15, LEAST(100, target + (random()*30 - 15))));
      INSERT INTO public.assessment_dimension_scores (assessment_id, dimension_id, score) VALUES (a_id, d.id, s);
      total := total + s * d.weight; wsum := wsum + d.weight;
    END LOOP;
    UPDATE public.assessments SET overall_score = round(total/wsum) WHERE id = a_id;
    UPDATE public.businesses SET biosphere_score = round(total/wsum), last_assessed_at = assessed, verified = (st = 'verified'), cia_completed = true,
      opening_hours = '{"Mon–Fri":"09:00 – 17:30","Sat":"10:00 – 16:00","Sun":"Closed"}'::jsonb,
      social_links = jsonb_build_object('instagram','https://instagram.com/biosphere_iom','facebook','https://facebook.com/biosphereisleofman')
    WHERE id = b.id;
  END LOOP;
  UPDATE public.businesses SET featured = true WHERE id IN (SELECT id FROM public.businesses ORDER BY biosphere_score DESC LIMIT 6);
END $$;