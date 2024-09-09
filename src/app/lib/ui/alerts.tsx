export default function Alerts({ message }: { message?: string}) {
	return (
		<div className={`absolute bottom-8 right-8 overflow-clip ${message == null ? "hidden" : "block"}`}>
			<div className={`p-2 rounded bg-red-500`} style={{
				animationName: "slide-in",
				animationDuration: "1s",
				animationFillMode: "forwards",
				animationTimingFunction: "ease-in"
			}}>
				<p className="text-white">{message}</p>
			</div>
		</div>
	)
}