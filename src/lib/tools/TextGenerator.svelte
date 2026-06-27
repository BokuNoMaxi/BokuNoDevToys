<script lang="ts">
	interface Model {
		id: string;
		label: string;
		language: string;
		sentences: string[];
	}

	const MODELS: Model[] = [
		{
			id: 'lorem-ipsum',
			label: 'Lorem Ipsum',
			language: 'Latein (klassisch)',
			sentences: [
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
				'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
				'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
				'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
				'Ut labore et dolore magnam aliquam quaerat voluptatem.',
				'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.',
				'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur adipisci velit.',
				'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum.',
				'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.',
				'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates.',
				'Et harum quidem rerum facilis est et expedita distinctio.',
				'Itaque earum rerum hic tenetur a sapiente delectus ut aut reiciendis voluptatibus maiores.',
				'Quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur.',
			]
		},
		{
			id: 'cicero',
			label: 'Cicero (Original)',
			language: 'Latein (De Finibus)',
			sentences: [
				'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
				'Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.',
				'Nulla consequat massa quis enim.',
				'Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.',
				'In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.',
				'Nullam dictum felis eu pede mollis pretium.',
				'Integer tincidunt, cras dapibus, vivamus elementum semper nisi.',
				'Aenean vulputate eleifend tellus, aenean leo ligula porttitor eu consequat vitae.',
				'Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue.',
				'Curabitur ullamcorper ultricies nisi, nam eget dui etiam rhoncus.',
				'Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero.',
				'Sit amet adipiscing sem, neque sed ipsum nam quam nunc blandit vel.',
				'Luctus nec ullamcorper mattis, pulvinar dapibus leo at augue varius.',
				'Fusce fermentum nullam varius nulla facilisi, cras non velit nec nisi vulputate.',
				'Phasellus viverra nulla ut metus varius laoreet, quisque rutrum aenean imperdiet.',
			]
		},
		{
			id: 'kafka',
			label: 'Kafka',
			language: 'Deutsch',
			sentences: [
				'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt.',
				'Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch.',
				'Die Bettdecke war zum gänzlichen Hinuntergleiten bereit und wollte kaum noch festhalten.',
				'Was ist mit mir geschehen, dachte er.',
				'Es war kein Traum, sein Zimmer, ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen den vier wohlbekannten Wänden.',
				'Über dem Tisch, auf dem eine auseinandergepackte Musterkollektion von Tuchwaren ausgebreitet war, hing das Bild, das er vor kurzem aus einer illustrierten Zeitschrift ausgeschnitten hatte.',
				'Es zeigte eine Dame, die, mit einem Pelzhut und einer Pelzboa versehen, aufrecht dasaß und dem Beschauer einen schweren Pelzmuff, in den ihr ganzer Unterarm verschwunden war, entgegenhob.',
				'Gregor Blick richtete sich dann zum Fenster, und das trübe Wetter machte ihn ganz melancholisch.',
				'Wie wäre es, wenn ich noch ein wenig weiterschliefe und alle Narrheiten vergäße, dachte er.',
				'Aber das war gänzlich undurchführbar, denn er war gewöhnt, auf der rechten Seite zu schlafen.',
				'Er müßte jedenfalls noch einige Zeit ruhig liegen bleiben und das Erwachen abwarten.',
				'In diesem Augenblick fiel es ihm aber ein, daß er ähnliches wie heute noch niemals gefühlt hatte.',
				'Der nächste Zug ging um sieben Uhr; um den einzuholen, hätte er sich unsinnig beeilen müssen.',
				'Von dem Kollektionsreisenden werden Akkuratesse und Pünktlichkeit verlangt, es ist sein unerbittliches Gesetz.',
				'Man hätte vielleicht meinen können, er schlafe nur und daß er ein wenig schlummre, aber sein Gesicht sei dabei völlig starr.',
			]
		},
		{
			id: 'nietzsche',
			label: 'Nietzsche',
			language: 'Deutsch',
			sentences: [
				'Was mich nicht umbringt, macht mich stärker.',
				'Gott ist tot. Gott bleibt tot. Und wir haben ihn getötet.',
				'Man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.',
				'Ohne Musik wäre das Leben ein Irrtum.',
				'Das Individuum ist immer das Einzige, das Allgemeine das Nichts.',
				'Es gibt keine Tatsachen, nur Interpretationen.',
				'Der Mensch ist etwas, das überwunden werden soll.',
				'Je mehr ich über Menschen nachdenke, desto mehr liebe ich Hunde.',
				'Die Überzeugungen sind gefährlichere Feinde der Wahrheit als die Lügen.',
				'In jedem echten Mann verbirgt sich ein Kind, das spielen will.',
				'Der Schlaf ist eine Erfindung der Demokratie.',
				'Man erkennt die Güte eines Baumes an seinen Früchten.',
				'Das Weib war der zweite Fehler Gottes.',
				'Viele sind hartnäckig in Bezug auf den eingeschlagenen Weg, wenige in Bezug auf das Ziel.',
				'Wer mit Ungeheuern kämpft, mag zusehn, dass er dabei nicht selbst zum Ungeheuer wird.',
			]
		},
		{
			id: 'twain',
			label: 'Mark Twain',
			language: 'Englisch',
			sentences: [
				'The reports of my death are greatly exaggerated.',
				'It is better to keep your mouth closed and let people think you are a fool than to open it and remove all doubt.',
				'Whenever you find yourself on the side of the majority, it is time to pause and reflect.',
				'Age is an issue of mind over matter. If you do not mind, it does not matter.',
				'The secret of getting ahead is getting started.',
				'Courage is resistance to fear, mastery of fear, not absence of fear.',
				'If you tell the truth, you do not have to remember anything.',
				'A man who carries a cat by the tail learns something he can learn in no other way.',
				'The lack of money is the root of all evil.',
				'Twenty years from now you will be more disappointed by the things that you did not do than by the ones you did.',
				'Kindness is the language which the deaf can hear and the blind can see.',
				'The secret source of humor itself is not joy but sorrow.',
				'Thunder is good, thunder is impressive, but it is lightning that does the work.',
				'The best way to cheer yourself up is to try to cheer somebody else up.',
				'Do not go around saying the world owes you a living. The world owes you nothing. It was here first.',
			]
		},
		{
			id: 'wilde',
			label: 'Oscar Wilde',
			language: 'Englisch',
			sentences: [
				'Be yourself; everyone else is already taken.',
				'To live is the rarest thing in the world. Most people exist, that is all.',
				'The truth is rarely pure and never simple.',
				'I can resist everything except temptation.',
				'A cynic is a man who knows the price of everything and the value of nothing.',
				'The only way to get rid of a temptation is to yield to it.',
				'We are all in the gutter, but some of us are looking at the stars.',
				'Always forgive your enemies; nothing annoys them so much.',
				'Fashion is a form of ugliness so intolerable that we have to alter it every six months.',
				'I am not young enough to know everything.',
				'There is only one thing in life worse than being talked about, and that is not being talked about.',
				'Experience is simply the name we give our mistakes.',
				'Art is the only serious thing in the world. And the artist is the only person who is never serious.',
				'The books that the world calls immoral are books that show the world its own shame.',
				'To define is to limit.',
			]
		},
		{
			id: 'pangrams-de',
			label: 'Pangramme (DE)',
			language: 'Deutsch',
			sentences: [
				'Franz jagt im komplett verwahrlosten Taxi quer durch Bayern.',
				'Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich.',
				'Falsches Üben von Xylophonmusik quält jeden größeren Zwerg.',
				'Heizölrückstoßabdämpfung — das längste bekannte deutsche Wort ohne Umlaute.',
				'Jörg bäckt quasi zwei Haxen vom Schwein für Kölner Zigeuner.',
				'Vogel Quax zwickt Johnys Pferd Bim.',
				'Xaver schreibt für Wikipedia zum Spaß Quiz-Antworten auf Japanisch.',
				'Welch fieser Katzentyp quält da süße Vögel bloß zum Jux?',
				'Die hübsche Köchin quälte für Viktor fünfzig exzentrische Zwerge.',
				'Im finsteren Jagdschloss am offenen Felsquellwasser patzte der affig-flatterhafte kauzig-höfliche Bischof.',
				'Prall zufrieden saß Mücke Xantippe durch Quell-Ströme quer.',
				'Typisch fließendes Quiz bewegt stark jedes X-Mal Dampf.',
				'Diakonische Zwerge bequemen sich wohl justament für uns.',
				'Sexy Typen quälen viel zu oft mit falschen Zügen.',
				'Götzendienst quälevoll macht jedes Bürger-Volk sehr fürchterlich.',
			]
		},
		{
			id: 'pangrams-en',
			label: 'Pangrams (EN)',
			language: 'Englisch',
			sentences: [
				'The quick brown fox jumps over the lazy dog.',
				'Pack my box with five dozen liquor jugs.',
				'How vainly men themselves amaze to win the palm, the oak, or the bays.',
				'Sphinx of black quartz, judge my vow.',
				'Two driven jocks help fax my big quiz.',
				'Five quacking zephyrs jolt my wax bed.',
				'The five boxing wizards jump quickly.',
				'Jackdaws love my big sphinx of quartz.',
				'Bright vixens jump; dozy fowl quack.',
				'Jived fox nymph grabs quick waltz.',
				'Glib jocks quiz nymph to vex dwarf.',
				'How quickly daft jumping zebras vex.',
				'Quick zephyrs blow, vexing daft Jim.',
				'Sex-charged fop blew my junk TV quiz.',
				'Waltz, bad nymph, for quick jigs vex.',
			]
		}
	];

	let selectedModel = $state(MODELS[0]);
	let paragraphs = $state(3);
	let maxChars = $state(0);
	let result = $state('');
	let copied = $state(false);

	function randomSentence(model: typeof MODELS[0]): string {
		return model.sentences[Math.floor(Math.random() * model.sentences.length)];
	}

	function generateParagraph(model: typeof MODELS[0], isFirst: boolean): string {
		if (isFirst && model.id === 'lorem-ipsum') {
			return model.sentences.slice(0, 5).join(' ');
		}
		const count = 4 + Math.floor(Math.random() * 4);
		return Array.from({ length: count }, () => randomSentence(model)).join(' ');
	}

	function generate() {
		const paras = Array.from({ length: paragraphs }, (_, i) =>
			generateParagraph(selectedModel, i === 0)
		);
		let text = paras.join('\n\n');
		if (maxChars > 0 && text.length > maxChars) {
			text = text.slice(0, maxChars).replace(/\s+\S*$/, '') + '…';
		}
		result = text;
		copied = false;
	}

	function copy() {
		navigator.clipboard.writeText(result);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	generate();
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Einstellungen</h2>

		<!-- Model Selector -->
		<div class="mb-5">
			<label for="model-select" class="block text-xs text-slate-500 mb-1.5">Modell / Stil</label>
			<div class="flex items-center gap-3">
				<select
					id="model-select"
					bind:value={selectedModel}
					class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
				>
					{#each MODELS as model}
						<option value={model}>{model.label} — {model.language}</option>
					{/each}
				</select>
				<span class="text-xs text-slate-600 shrink-0">{selectedModel.sentences.length} Sätze</span>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<div>
				<label for="para-range" class="block text-sm text-slate-400 mb-2">
					Absätze: <span class="text-violet-400 font-semibold">{paragraphs}</span>
				</label>
				<input id="para-range" type="range" min="1" max="20" bind:value={paragraphs} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>20</span></div>
			</div>
			<div>
				<label for="chars-range" class="block text-sm text-slate-400 mb-2">
					Max. Zeichen: <span class="text-violet-400 font-semibold">{maxChars === 0 ? 'unbegrenzt' : maxChars}</span>
				</label>
				<input id="chars-range" type="range" min="0" max="5000" step="50" bind:value={maxChars} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-600 mt-1"><span>∞</span><span>5000</span></div>
			</div>
		</div>

		<button onclick={generate} class="mt-5 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors">
			Generieren
		</button>
	</div>

	{#if result}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ergebnis</h2>
				<div class="flex items-center gap-3">
					<span class="text-xs text-slate-500">{result.length} Zeichen</span>
					<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-400 transition-colors">
						{copied ? '✓ Kopiert' : 'Kopieren'}
					</button>
				</div>
			</div>
			<div class="bg-slate-900 rounded-lg p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-serif max-h-[500px] overflow-y-auto">
				{result}
			</div>
		</div>
	{/if}
</div>
