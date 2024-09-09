export default function Alerts({ message }: { message?: string}) {
	return (
		<div className={`absolute bottom-0 right-0 p-2 rounded bg-red-500 ${message == null ? "hidden" : "block"}`} style={{
			animationName: "slide-in",
			animationDelay: "150ms",
			animationDuration: "1s",
			animationFillMode: "forwards",
			animationTimingFunction: "ease-in"
		}}>
			<p className="text-white">{message}</p>
		</div>
	)
}